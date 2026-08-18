import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

type PasswordHash = {
  salt: Buffer;
  hash: Buffer;
};

function parsePasswordHash(): PasswordHash | null {
  const encoded = process.env.STUDIO_LOGIN_PASSWORD_HASH?.trim();

  if (!encoded) {
    return null;
  }

  const [algorithm, saltValue, hashValue] = encoded.split(":");

  if (algorithm !== HASH_PREFIX || !saltValue || !hashValue) {
    return null;
  }

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const hash = Buffer.from(hashValue, "base64url");

    if (!salt.length || hash.length !== KEY_LENGTH) {
      return null;
    }

    return { salt, hash };
  } catch {
    return null;
  }
}

export function isLoginPasswordConfigured(): boolean {
  return parsePasswordHash() !== null;
}

export function verifyLoginPassword(password: string): boolean {
  const stored = parsePasswordHash();

  if (!stored || !password || password.length > 1024) {
    return false;
  }

  const candidate = scryptSync(password, stored.salt, KEY_LENGTH);
  return timingSafeEqual(candidate, stored.hash);
}
