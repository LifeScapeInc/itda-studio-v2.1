import "server-only";

import { cookies } from "next/headers";

export const OPENAI_API_KEY_ENV_NAME = "OPENAI_API_KEY";

const SETTINGS_COOKIE_NAME = "itda-studio-openai-settings";
const SETTINGS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type StoredAppSettings = {
  schemaVersion: 2;
  openAiApiKey?: string;
  openAiApiKeyMode?: OpenAiApiKeyMode;
};

export type OpenAiApiKeyMode = "env" | "workspace";

export type AppSettingsStatus = {
  hasOpenAiApiKey: boolean;
  openAiApiKeyPreview?: string;
  openAiApiKeySource: "env" | "workspace" | "none";
  openAiApiKeyMode: OpenAiApiKeyMode;
  hasEnvironmentOpenAiApiKey: boolean;
  environmentOpenAiApiKeyPreview?: string;
  hasStoredOpenAiApiKey: boolean;
  storedOpenAiApiKeyPreview?: string;
  environmentVariable: typeof OPENAI_API_KEY_ENV_NAME;
};

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) {
    return "등록된 키";
  }

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

function getEncryptionSecret(): string {
  const secret = process.env.STUDIO_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "직접 입력 API 키를 저장하려면 STUDIO_AUTH_SECRET을 32자 이상으로 설정해야 합니다.",
    );
  }
  return secret;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = getEncryptionSecret();
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`itda-studio:openai-settings:v1:${secret}`),
  );

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function sealSettings(settings: StoredAppSettings): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encoder.encode(SETTINGS_COOKIE_NAME),
    },
    await getEncryptionKey(),
    encoder.encode(JSON.stringify(settings)),
  );

  return `${Buffer.from(iv).toString("base64url")}.${
    Buffer.from(encrypted).toString("base64url")
  }`;
}

async function unsealSettings(value: string): Promise<StoredAppSettings> {
  const [encodedIv, encodedPayload] = value.split(".");
  if (!encodedIv || !encodedPayload) {
    throw new Error("저장된 API 설정 형식이 올바르지 않습니다.");
  }

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(Buffer.from(encodedIv, "base64url")),
      additionalData: encoder.encode(SETTINGS_COOKIE_NAME),
    },
    await getEncryptionKey(),
    new Uint8Array(Buffer.from(encodedPayload, "base64url")),
  );
  const parsed = JSON.parse(decoder.decode(decrypted)) as Partial<StoredAppSettings>;
  const openAiApiKey = typeof parsed.openAiApiKey === "string"
    ? parsed.openAiApiKey.trim()
    : "";

  return {
    schemaVersion: 2,
    openAiApiKey: openAiApiKey || undefined,
    openAiApiKeyMode: parsed.openAiApiKeyMode === "env"
      || parsed.openAiApiKeyMode === "workspace"
      ? parsed.openAiApiKeyMode
      : undefined,
  };
}

async function readStoredSettings(): Promise<StoredAppSettings> {
  try {
    const value = (await cookies()).get(SETTINGS_COOKIE_NAME)?.value;
    return value ? await unsealSettings(value) : { schemaVersion: 2 };
  } catch {
    return { schemaVersion: 2 };
  }
}

async function writeStoredSettings(settings: StoredAppSettings): Promise<void> {
  const cookieStore = await cookies();

  if (!settings.openAiApiKey && !settings.openAiApiKeyMode) {
    cookieStore.delete(SETTINGS_COOKIE_NAME);
    return;
  }

  cookieStore.set(SETTINGS_COOKIE_NAME, await sealSettings(settings), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SETTINGS_COOKIE_MAX_AGE,
  });
}

function buildAppSettingsStatus(stored: StoredAppSettings): AppSettingsStatus {
  const environmentKey = process.env[OPENAI_API_KEY_ENV_NAME]?.trim() ?? "";
  const storedKey = stored.openAiApiKey ?? "";
  const openAiApiKeyMode = stored.openAiApiKeyMode
    ?? (environmentKey ? "env" : "workspace");
  const common: Pick<
    AppSettingsStatus,
    | "hasStoredOpenAiApiKey"
    | "storedOpenAiApiKeyPreview"
    | "environmentVariable"
    | "openAiApiKeyMode"
    | "hasEnvironmentOpenAiApiKey"
    | "environmentOpenAiApiKeyPreview"
  > = {
    hasStoredOpenAiApiKey: Boolean(storedKey),
    storedOpenAiApiKeyPreview: storedKey ? maskApiKey(storedKey) : undefined,
    environmentVariable: OPENAI_API_KEY_ENV_NAME,
    openAiApiKeyMode,
    hasEnvironmentOpenAiApiKey: Boolean(environmentKey),
    environmentOpenAiApiKeyPreview: environmentKey
      ? maskApiKey(environmentKey)
      : undefined,
  };

  if (openAiApiKeyMode === "env" && environmentKey) {
    return {
      ...common,
      hasOpenAiApiKey: true,
      openAiApiKeyPreview: maskApiKey(environmentKey),
      openAiApiKeySource: "env",
    };
  }

  if (openAiApiKeyMode === "workspace" && storedKey) {
    return {
      ...common,
      hasOpenAiApiKey: true,
      openAiApiKeyPreview: maskApiKey(storedKey),
      openAiApiKeySource: "workspace",
    };
  }

  return {
    ...common,
    hasOpenAiApiKey: false,
    openAiApiKeySource: "none",
  };
}

export async function readAppSettingsStatus(): Promise<AppSettingsStatus> {
  return buildAppSettingsStatus(await readStoredSettings());
}

export async function getOpenAIApiKey(): Promise<string> {
  const stored = await readStoredSettings();
  const environmentKey = process.env[OPENAI_API_KEY_ENV_NAME]?.trim() ?? "";
  const mode = stored.openAiApiKeyMode
    ?? (environmentKey ? "env" : "workspace");

  return mode === "env" ? environmentKey : stored.openAiApiKey ?? "";
}

export async function setOpenAIApiKeyMode(
  openAiApiKeyMode: OpenAiApiKeyMode,
): Promise<AppSettingsStatus> {
  const stored = await readStoredSettings();
  const nextSettings: StoredAppSettings = {
    ...stored,
    schemaVersion: 2,
    openAiApiKeyMode,
  };
  await writeStoredSettings(nextSettings);
  return buildAppSettingsStatus(nextSettings);
}

export async function saveOpenAIApiKey(
  apiKey: string,
): Promise<AppSettingsStatus> {
  const cleaned = apiKey.trim();
  if (!cleaned) {
    throw new Error("API 키가 비어 있습니다.");
  }

  const nextSettings: StoredAppSettings = {
    schemaVersion: 2,
    openAiApiKey: cleaned,
    openAiApiKeyMode: "workspace",
  };
  await writeStoredSettings(nextSettings);
  return buildAppSettingsStatus(nextSettings);
}

export async function deleteStoredOpenAIApiKey(): Promise<AppSettingsStatus> {
  const stored = await readStoredSettings();
  const nextSettings: StoredAppSettings = {
    schemaVersion: 2,
    openAiApiKeyMode: stored.openAiApiKeyMode ?? "workspace",
  };
  await writeStoredSettings(nextSettings);
  return buildAppSettingsStatus(nextSettings);
}
