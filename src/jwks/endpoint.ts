import { clearKeys, getKeyset, keysetToJwks, saveNewKey } from "./keys";

import Env from "../env";

import { JSONResponse } from "@worker-tools/json-fetch";
import { Context } from "@worker-tools/middleware";
import { ok } from "@worker-tools/response-creators";

export async function jwksEndpoint(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const keyset = await getKeyset(env);
  return new JSONResponse(keysetToJwks(keyset), ok());
}

export async function jwksRefreshEndpoint(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  // TODO: authorization
  await saveNewKey(env);
  return await jwksEndpoint(req, ctx);
}

export async function jwksClearEndpoint(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  // TODO: authorization
  await clearKeys(env);
  return await jwksEndpoint(req, ctx);
}
