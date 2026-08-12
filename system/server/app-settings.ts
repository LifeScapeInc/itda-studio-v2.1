import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const OPENAI_API_KEY_ENV_NAME = "OPENAI_API_KEY";

type StoredAppSettings = {
  schemaVersion: 1;
  openAiApiKey?: string;
};

export type AppSettingsStatus = {
  hasOpenAiApiKey: boolean;
  openAiApiKeyPreview?: string;
  openAiApiKeySource: "env" | "workspace" | "none";
  hasStoredOpenAiApiKey: boolean;
  storedOpenAiApiKeyPreview?: string;
  environmentVariable: typeof OPENAI_API_KEY_ENV_NAME;
};

function settingsDirectory(): string {
  return path.join(process.cwd(), "workspace", "metadata");
}

function settingsPath(): string {
  return path.join(settingsDirectory(), "settings.json");
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) {
    return "등록된 키";
  }

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

async function readStoredSettings(): Promise<StoredAppSettings> {
  try {
    const raw = await readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredAppSettings>;
    const openAiApiKey = typeof parsed.openAiApiKey === "string"
      ? parsed.openAiApiKey.trim()
      : "";

    return {
      schemaVersion: 1,
      openAiApiKey: openAiApiKey || undefined,
    };
  } catch {
    return { schemaVersion: 1 };
  }
}

async function writeStoredSettings(
  settings: StoredAppSettings,
): Promise<void> {
  if (!settings.openAiApiKey) {
    await rm(settingsPath(), { force: true });
    return;
  }

  await mkdir(settingsDirectory(), { recursive: true });
  await writeFile(
    settingsPath(),
    JSON.stringify(settings, null, 2),
    "utf8",
  );
}

export async function readAppSettingsStatus(): Promise<AppSettingsStatus> {
  const stored = await readStoredSettings();
  const environmentKey = process.env[OPENAI_API_KEY_ENV_NAME]?.trim() ?? "";
  const storedKey = stored.openAiApiKey ?? "";
  const common: Pick<
    AppSettingsStatus,
    | "hasStoredOpenAiApiKey"
    | "storedOpenAiApiKeyPreview"
    | "environmentVariable"
  > = {
    hasStoredOpenAiApiKey: Boolean(storedKey),
    storedOpenAiApiKeyPreview: storedKey ? maskApiKey(storedKey) : undefined,
    environmentVariable: OPENAI_API_KEY_ENV_NAME,
  };

  if (environmentKey) {
    return {
      ...common,
      hasOpenAiApiKey: true,
      openAiApiKeyPreview: maskApiKey(environmentKey),
      openAiApiKeySource: "env",
    };
  }

  if (storedKey) {
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

export async function getOpenAIApiKey(): Promise<string> {
  const environmentKey = process.env[OPENAI_API_KEY_ENV_NAME]?.trim();
  if (environmentKey) {
    return environmentKey;
  }

  const stored = await readStoredSettings();
  return stored.openAiApiKey ?? "";
}

export async function saveOpenAIApiKey(
  apiKey: string,
): Promise<AppSettingsStatus> {
  const cleaned = apiKey.trim();
  if (!cleaned) {
    throw new Error("API 키가 비어 있습니다.");
  }

  await writeStoredSettings({
    schemaVersion: 1,
    openAiApiKey: cleaned,
  });
  return readAppSettingsStatus();
}

export async function deleteStoredOpenAIApiKey(): Promise<AppSettingsStatus> {
  await writeStoredSettings({ schemaVersion: 1 });
  return readAppSettingsStatus();
}
