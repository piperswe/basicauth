import React from "react";
import { Context } from "@worker-tools/middleware";
import { badRequest, forbidden, found } from "@worker-tools/response-creators";
import Env from "../env";
import AuthorizationForm from "./AuthorizationForm";
import { getClientById } from "../clients/clients";
import { checkPassword, getUserByUsername } from "../users.ts/users";
import { okReact } from "../frontend/render";

export interface FormContext {
  responseType: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  state: string | null;
  nonce: string | null;
  csrfToken: string;
}

export async function authorizationForm(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const url = new URL(req.url);
  const responseType = url.searchParams.get("response_type");
  if (responseType == null) {
    return badRequest("Missing response type");
  }
  if (responseType !== "code") {
    return badRequest("Invalid response type");
  }
  const clientId = url.searchParams.get("client_id");
  if (clientId == null) {
    return badRequest("Missing client ID");
  }
  const scope = url.searchParams.get("scope");
  if (scope == null) {
    return badRequest("Missing scope");
  }
  const redirectUri = url.searchParams.get("redirect_uri");
  if (redirectUri == null) {
    return badRequest("Missing redirect URI");
  }
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");
  const client = await getClientById(env, clientId);
  if (client == null) {
    return badRequest("Invalid client ID");
  }
  const csrfToken = crypto.randomUUID();
  await env.CSRF_TOKENS.put(csrfToken, "ok", {
    expirationTtl: 120,
  });
  const formContext: FormContext = {
    responseType,
    clientId,
    scope,
    redirectUri,
    state,
    nonce,
    csrfToken,
  };
  return okReact(
    <AuthorizationForm env={env} formContext={formContext} client={client} />
  );
}

export interface CodeData {
  userId: number;
  clientId: string;
  redirectUri: string;
}

export async function authorizationEndpoint(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const formData = await req.formData();
  const username = formData.get("username");
  if (username == null) {
    return badRequest("Missing username");
  }
  const password = formData.get("password");
  if (password == null) {
    return badRequest("Missing password");
  }
  const contextJson = formData.get("context");
  if (contextJson == null) {
    return badRequest("Missing context");
  }
  const context: FormContext = JSON.parse(contextJson);
  const hasCsrf = (await env.CSRF_TOKENS.get(context.csrfToken)) === "ok";
  if (!hasCsrf) {
    return badRequest("Your CSRF token has expired. Please try again.");
  }
  await env.CSRF_TOKENS.delete(context.csrfToken);
  const user = await getUserByUsername(env, username);
  if (user == null) {
    if ("LOGIN_ANALYTICS" in env) {
      env.LOGIN_ANALYTICS.writeDataPoint({
        blobs: [`client:${context.clientId}`, "invalidUsername"],
        indexes: ["noUser"],
      });
    }
    return forbidden("Invalid username or password");
  }
  const passwordOk = await checkPassword(user, password);
  if (!passwordOk) {
    if ("LOGIN_ANALYTICS" in env) {
      env.LOGIN_ANALYTICS.writeDataPoint({
        blobs: [`client:${context.clientId}`, "invalidPassword"],
        indexes: [`user:${user.id}`],
      });
    }
    return forbidden("Invalid username or password");
  }
  const code = crypto.randomUUID();
  await env.AUTHCODES.put(
    code,
    JSON.stringify({
      userId: user.id,
      clientId: context.clientId,
      redirectUri: context.redirectUri,
    }),
    {
      expirationTtl: 60,
    }
  );
  if ("LOGIN_ANALYTICS" in env) {
    env.LOGIN_ANALYTICS.writeDataPoint({
      blobs: [`client:${context.clientId}`, "authorization"],
      indexes: [`user:${user.id}`],
    });
  }
  const redirectUri = new URL(context.redirectUri);
  redirectUri.searchParams.set("code", code);
  if (context.state) {
    redirectUri.searchParams.set("state", context.state);
  }
  return found(redirectUri);
}

export async function getCodeData(
  env: Env,
  code: string
): Promise<CodeData | null> {
  const data = await env.AUTHCODES.get<CodeData>(code, "json");
  if (data == null) {
    return null;
  }
  return data;
}
