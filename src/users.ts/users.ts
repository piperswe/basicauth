import Env from "../env";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export async function getUsers(env: Env): Promise<User[]> {
  const result = await env.DB.prepare(
    `
      SELECT * FROM users
    `
  ).all<User>();
  if (!result.success) {
    throw new Error("Failed to get users: " + JSON.stringify(result));
  }
  return result.results ?? [];
}

export async function getUserById(env: Env, id: number): Promise<User | null> {
  return await env.DB.prepare(
    `
      SELECT * FROM users WHERE id = ?
    `
  )
    .bind(id)
    .first();
}

export async function getUserByUsername(
  env: Env,
  username: string
): Promise<User | null> {
  return await env.DB.prepare(
    `
      SELECT * FROM users WHERE username = ?
    `
  )
    .bind(username)
    .first();
}

export async function checkPassword(
  user: User,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, user.passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 8);
}

export async function changeUserPassword(
  env: Env,
  userId: number,
  password: string
): Promise<User> {
  const user = await getUserById(env, userId);
  if (user == null) {
    throw new Error("Invalid user ID");
  }
  user.passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    `
      UPDATE users SET passwordHash = ? WHERE id = ?
    `
  )
    .bind(user.passwordHash, user.id)
    .run();
  if (!result.success) {
    throw new Error("Couldn't change password: " + JSON.stringify(result));
  }
  return user;
}

export async function createUser(
  env: Env,
  username: string,
  password: string
): Promise<User> {
  const hash = await hashPassword(password);
  const result = await env.DB.prepare(
    `
      INSERT INTO users (username, passwordHash) VALUES (?, ?)
    `
  )
    .bind(username, hash)
    .run();
  if (!result.success) {
    throw new Error("Couldn't create user: " + JSON.stringify(result));
  }
  const user = await getUserByUsername(env, username);
  if (user == null) {
    throw new Error("User didn't exist after creating it");
  }
  return user;
}

export async function deleteUser(env: Env, id: number): Promise<void> {
  const result = await env.DB.prepare(
    `
      DELETE FROM users WHERE id = ?
    `
  )
    .bind(id)
    .run();
  if (!result.success) {
    throw new Error("Failed to delete user: " + JSON.stringify(result));
  }
}
