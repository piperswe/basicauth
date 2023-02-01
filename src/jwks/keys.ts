import { exportJWK, generateKeyPair, importJWK, KeyLike } from "jose";
import Env from "../env";

const defaultAlg = "RS256";

interface DBKey {
  id: number;
  valid: number;
  created: number;
  publicKey: string;
  privateKey: string;
  alg: string;
}

export interface Key {
  id: number;
  valid: boolean;
  created: Date;
  publicKey: KeyLike | Uint8Array;
  publicJWK: string;
  privateKey: KeyLike | Uint8Array;
  privateJWK: string;
  alg: string;
}

export interface Keyset {
  keys: Key[];
}

async function interpretKey(key: DBKey): Promise<Key> {
  return {
    id: key.id,
    valid: key.valid === 1,
    created: new Date(key.created),
    publicKey: await importJWK(JSON.parse(key.publicKey), key.alg),
    publicJWK: key.publicKey,
    privateKey: await importJWK(JSON.parse(key.privateKey), key.alg),
    privateJWK: key.privateKey,
    alg: key.alg,
  };
}

function serializeKey(key: Key): DBKey {
  return {
    id: key.id,
    valid: 1,
    created: key.created.getTime(),
    publicKey: key.publicJWK,
    privateKey: key.privateJWK,
    alg: key.alg,
  };
}

export async function getKeyset(env: Env): Promise<Keyset> {
  const { results } = await env.DB.prepare(
    `
    SELECT * FROM jwks WHERE valid ORDER BY created ASC
  `
  ).all<DBKey>();
  return {
    keys: await Promise.all((results ?? []).map(interpretKey)),
  };
}

export function getSigningKey(keyset: Keyset): Key {
  const key = keyset.keys[keyset.keys.length - 1];
  if (key == null) {
    throw new Error("Missing signing key");
  }
  return key;
}

async function generateNewKey(): Promise<Key> {
  const { publicKey, privateKey } = await generateKeyPair(defaultAlg, {
    extractable: true,
  });
  return {
    valid: true,
    publicKey,
    publicJWK: JSON.stringify(await exportJWK(publicKey)),
    privateKey,
    privateJWK: JSON.stringify(await exportJWK(privateKey)),
    alg: defaultAlg,
    id: -1,
    created: new Date(),
  };
}

export async function saveNewKey(env: Env): Promise<void> {
  const key = await generateNewKey();
  const serialized = serializeKey(key);
  const insertResult = await env.DB.prepare(
    `
      INSERT INTO jwks (valid, publicKey, privateKey, alg, created) VALUES (TRUE, ?, ?, ?, unixepoch())
    `
  )
    .bind(serialized.publicKey, serialized.privateKey, serialized.alg)
    .run();
  if (!insertResult.success) {
    throw new Error("Failed to insert key: " + JSON.stringify(insertResult));
  }
  const allKeys = await getKeyset(env);
  const oldKey = allKeys.keys[0];
  if (oldKey && allKeys.keys.length > 2) {
    console.warn("Invalidating oldest valid key", oldKey.id);
    const deleteResult = await env.DB.prepare(
      `
        UPDATE jwks SET valid = FALSE WHERE id = ?
      `
    )
      .bind(oldKey.id)
      .run();
    if (!deleteResult.success) {
      throw new Error(
        "Failed to update old key: " + JSON.stringify(deleteResult)
      );
    }
  }
}

export async function clearKeys(env: Env): Promise<void> {
  const deleteResult = await env.DB.prepare(`DELETE FROM jwks`).run();
  if (!deleteResult.success) {
    throw new Error("Failed to delete keys: " + JSON.stringify(deleteResult));
  }
}

export function keysetToJwks(keyset: Keyset) {
  return {
    keys: keyset.keys.map((key) => ({
      alg: key.alg,
      ...JSON.parse(key.publicJWK),
    })),
  };
}
