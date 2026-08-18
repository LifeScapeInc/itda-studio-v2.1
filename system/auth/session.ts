const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "itda-studio-session";
const SESSION_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 12;

type SessionPayload = {
  version: 1;
  expiresAt: number;
};

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);

  return Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0),
  ).buffer;
}

function getAuthSecret(): string | null {
  const secret = process.env.STUDIO_AUTH_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function isSessionAuthConfigured(): boolean {
  return getAuthSecret() !== null;
}

export async function createSessionToken(): Promise<string> {
  const secret = getAuthSecret();

  if (!secret) {
    throw new Error("STUDIO_AUTH_SECRET is not configured.");
  }

  const payload: SessionPayload = {
    version: 1,
    expiresAt: Date.now() + SESSION_TOKEN_LIFETIME_MS,
  };
  const encodedPayload = encodeBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = getAuthSecret();

  if (!secret || !token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  try {
    const [encodedPayload, encodedSignature] = parts;
    const key = await importSigningKey(secret);
    const signatureIsValid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );

    if (!signatureIsValid) {
      return false;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<SessionPayload>;

    return payload.version === 1
      && typeof payload.expiresAt === "number"
      && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
