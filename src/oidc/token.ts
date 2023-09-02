import { getCodeData } from "./authorization";

import { Client, getClientById } from "../clients/clients";
import Env from "../env";
import { getKeyset, getSigningKey, Key } from "../jwks/keys";
import { getUserById, User } from "../users/users";

import { JSONResponse } from "@worker-tools/json-fetch";
import { Context } from "@worker-tools/middleware";
import { badRequest, forbidden, ok } from "@worker-tools/response-creators";
import { SignJWT } from "jose";

const expirationTime = 60 * 60 * 24;

export async function generateToken(
  env: Env,
  key: Key,
  user: User,
  client: Client
): Promise<string> {
  return await new SignJWT({
    preferred_username: user.username,
    email: user.email,
  })
    .setProtectedHeader({ alg: key.alg, typ: "JWT" })
    .setIssuedAt()
    .setIssuer(`https://${env.DOMAIN}/`)
    .setSubject(user.username)
    .setAudience(client.id)
    .setExpirationTime(Math.round(Date.now() / 1000 + expirationTime))
    .sign(key.privateKey);
}

export default async function tokenEndpoint(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const clientSecret = req.headers
    .get("Authorization")
    ?.replace(/^Bearer /, "")
    ?.replace(/^Basic /, "");
  if (!clientSecret) {
    console.log("Missing auth token");
    return forbidden("Missing auth token");
  }
  const formData = await req.formData();
  const grantType = formData.get("grant_type");
  if (grantType !== "authorization_code") {
    console.log("Invalid grant type");
    return badRequest("Invalid grant type");
  }
  const code = formData.get("code");
  if (code == null) {
    console.log("Missing authorization code");
    return badRequest("Missing authorization code");
  }
  // const redirectUri = formData.get("redirect_uri");
  // if (redirectUri == null) {
  //   console.log("Missing redirect URI");
  //   return badRequest("Missing redirect URI");
  // }
  const codeData = await getCodeData(env, code);
  if (codeData == null) {
    console.log("Invalid code", code);
    return forbidden("Invalid code");
  }
  // if (codeData.redirectUri !== redirectUri) {
  //   console.log("Request URI mismatch");
  //   return forbidden("Request URI mismatch");
  // }
  const client = await getClientById(env, codeData.clientId);
  if (client == null) {
    console.log("Invalid client ID in auth code");
    throw new Error(
      "Authorization code had invalid client ID " + codeData.clientId
    );
  }
  // if (client.secret !== clientSecret) {
  //   console.log("Invalid client secret ", client, clientSecret);
  //   return forbidden("Invalid client secret");
  // }
  const user = await getUserById(env, codeData.userId);
  if (user == null) {
    console.log("Invalid user ID in auth code");
    throw new Error(
      "Authorization code had invalid user ID " + codeData.userId
    );
  }
  const key = getSigningKey(await getKeyset(env));
  const token = await generateToken(env, key, user, client);
  console.log("json response", token);
  return new JSONResponse(
    {
      access_token: token,
      id_token: token,
      token_type: "id_token",
      expires_in: expirationTime,
      scope: "openid",
    },
    ok()
  );
}
