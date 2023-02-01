import { WorkerRouter } from "@worker-tools/router";
import { permanentRedirect } from "@worker-tools/response-creators";
import oidcDiscovery from "./oidc/discovery";
import { jwksClearEndpoint, jwksEndpoint } from "./jwks/endpoint";
import { authorizationForm, authorizationEndpoint } from "./oidc/authorization";
import admin from "./admin";
import tokenEndpoint from "./oidc/token";
import Env from "./env";

export default new WorkerRouter()
  .get("/", (req, ctx) => permanentRedirect((ctx.env as Env).ROOT_REDIRECT))
  .get("/.well-known/openid-configuration", oidcDiscovery)
  .get("/.well-known/jwks.json", jwksEndpoint)
  .delete("/.well-known/jwks.json", jwksClearEndpoint)
  .get("/oidc/authorize", authorizationForm)
  .post("/oidc/authorize", authorizationEndpoint)
  .post("/oidc/token", tokenEndpoint)
  .use("/admin*", admin)
  .recover("*", (req, { error, response }) => {
    console.error("error: ", error);
    return response;
  });
