import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const OPENAI_API_KEY_ENV_NAME = "OPENAI_API_KEY";

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
      schemaVersion: 2,
      openAiApiKey: openAiApiKey || undefined,
      openAiApiKeyMode: parsed.openAiApiKeyMode === "env"
        || parsed.openAiApiKeyMode === "workspace"
        ? parsed.openAiApiKeyMode
        : undefined,
    };
  } catch {
    return { schemaVersion: 2 };
  }
}

async function writeStoredSettings(
  settings: StoredAppSettings,
): Promise<void> {
  if (!settings.openAiApiKey && !settings.openAiApiKeyMode) {
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
  await writeStoredSettings({
    ...stored,
    schemaVersion: 2,
    openAiApiKeyMode,
  });
  return readAppSettingsStatus();
}

export async function saveOpenAIApiKey(
  apiKey: string,
): Promise<AppSettingsStatus> {
  const cleaned = apiKey.trim();
  if (!cleaned) {
    throw new Error("API 키가 비어 있습니다.");
  }

  await writeStoredSettings({
    schemaVersion: 2,
    openAiApiKey: cleaned,
    openAiApiKeyMode: "workspace",
  });
  return readAppSettingsStatus();
}

export async function deleteStoredOpenAIApiKey(): Promise<AppSettingsStatus> {
  const stored = await readStoredSettings();
  await writeStoredSettings({
    schemaVersion: 2,
    openAiApiKeyMode: stored.openAiApiKeyMode ?? "workspace",
  });
  return readAppSettingsStatus();
}
