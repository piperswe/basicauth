import Env from "../env";

export interface Client {
  id: string;
  name: string;
  secret: string;
}

export async function getClientById(
  env: Env,
  id: string
): Promise<Client | null> {
  // TODO: authorization
  return await env.DB.prepare(
    `
      SELECT * FROM clients WHERE id = ?
    `
  )
    .bind(id)
    .first();
}

export async function getClients(env: Env): Promise<Client[]> {
  const result = await env.DB.prepare(
    `
      SELECT * FROM clients
    `
  ).all<Client>();
  if (!result.success) {
    throw new Error("Failed to get clients: " + JSON.stringify(result));
  }
  return result.results ?? [];
}

export async function createClient(env: Env, name: string): Promise<Client> {
  if (name == null || name.length < 3) {
    throw new Error("Invalid name (should be at least 3 characters)");
  }
  const id = crypto.randomUUID();
  const secret = crypto.randomUUID();
  const result = await env.DB.prepare(
    `
      INSERT INTO clients (id, name, secret) VALUES (?, ?, ?)
    `
  )
    .bind(id, name, secret)
    .run();
  if (!result.success) {
    throw new Error("Failed to create client: " + JSON.stringify(result));
  }
  return { id, name, secret };
}

export async function deleteClient(env: Env, id: string): Promise<void> {
  const result = await env.DB.prepare(
    `
      DELETE FROM clients WHERE id = ?
    `
  )
    .bind(id)
    .run();
  if (!result.success) {
    throw new Error("Failed to delete client: " + JSON.stringify(result));
  }
}
