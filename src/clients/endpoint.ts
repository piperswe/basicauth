import { JSONResponse } from "@worker-tools/json-fetch";
import { BasicsContext, Context } from "@worker-tools/middleware";
import { badRequest, notFound, ok } from "@worker-tools/response-creators";
import { RouteContext } from "@worker-tools/router";
import Env from "../env";
import { createClient, getClientById, getClients } from "./clients";

export async function getClientEndpoint(
  req: Request,
  ctx: BasicsContext & RouteContext
) {
  // TODO: authorization
  const env = ctx.env as Env;
  const { id } = ctx.params;
  if (id == null) {
    return notFound("Invalid client ID");
  }
  const client = await getClientById(env, id);
  if (client == null) {
    return notFound("Invalid client ID");
  }
  return new JSONResponse(client, ok());
}

export async function getClientsEndpoint(req: Request, ctx: Context) {
  // TODO: authorization
  const env = ctx.env as Env;
  const clients = await getClients(env);
  return new JSONResponse(clients, ok());
}

export async function createClientEndpoint(req: Request, ctx: Context) {
  // TODO: authorization
  const env = ctx.env as Env;
  const { name }: { name: string } = await req.json();
  const client = await createClient(env, name);
  return new JSONResponse(client, ok());
}
