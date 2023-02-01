import { JSONResponse } from "@worker-tools/json-fetch";
import { Context } from "@worker-tools/middleware";
import { ok } from "@worker-tools/response-creators";
import Env from "../env";

export default function oidcDiscovery(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  return new JSONResponse(
    {
      issuer: `https://${env.DOMAIN}/`,
      authorization_endpoint: `https://${env.DOMAIN}/oidc/authorize`,
      token_endpoint: `https://${env.DOMAIN}/oidc/token`,
      userinfo_endpoint: `https://${env.DOMAIN}/.well-known/jwks.json`,
    },
    ok()
  );
}
