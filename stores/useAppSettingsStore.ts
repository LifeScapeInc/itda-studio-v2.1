"use client";

import { create } from "zustand";
import type {
  AppSettingsStatus,
  OpenAiApiKeyMode,
} from "@/system/server/app-settings";

const MOCK_MODE_STORAGE_KEY = "itda-studio-v2.1:mock-mode";

type AppSettingsStore = {
  status: AppSettingsStatus | null;
  mockMode: boolean;
  loading: boolean;
  saving: boolean;
  message: string;
  loadStatus: () => Promise<void>;
  setApiKeyMode: (mode: OpenAiApiKeyMode) => Promise<boolean>;
  saveApiKey: (apiKey: string) => Promise<boolean>;
  resetApiKey: () => Promise<boolean>;
  setMockMode: (mockMode: boolean) => void;
};

function readMockMode(): boolean {
  return typeof window !== "undefined"
    && window.localStorage.getItem(MOCK_MODE_STORAGE_KEY) === "true";
}

async function responseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      return new Error(body.error);
    }
  } catch {
    // Use the user-facing fallback when the server did not return JSON.
  }

  return new Error(fallback);
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  status: null,
  mockMode: readMockMode(),
  loading: false,
  saving: false,
  message: "",
  loadStatus: async () => {
    if (get().loading) {
      return;
    }

    set({ loading: true, message: "" });
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error();
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        mockMode: readMockMode(),
        loading: false,
      });
    } catch {
      set({
        loading: false,
        message: "API 설정을 불러오지 못했습니다.",
      });
    }
  },
  setApiKeyMode: async (openAiApiKeyMode) => {
    set({ saving: true, message: "" });
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openAiApiKeyMode }),
      });
      if (!response.ok) {
        throw await responseError(
          response,
          "API 키 사용 방식을 변경하지 못했습니다.",
        );
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: openAiApiKeyMode === "env"
          ? "환경변수 API 키 사용을 선택했습니다."
          : "직접 입력 API 키 사용을 선택했습니다.",
      });
      return true;
    } catch (error) {
      set({
        saving: false,
        message: error instanceof Error
          ? error.message
          : "API 키 사용 방식을 변경하지 못했습니다.",
      });
      return false;
    }
  },
  saveApiKey: async (apiKey) => {
    set({ saving: true, message: "" });
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openAiApiKey: apiKey }),
      });
      if (!response.ok) {
        throw await responseError(response, "API 키를 저장하지 못했습니다.");
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: "직접 입력한 API 키를 저장하고 사용 방식으로 선택했습니다.",
      });
      return true;
    } catch (error) {
      set({
        saving: false,
        message: error instanceof Error ? error.message : "API 키를 저장하지 못했습니다.",
      });
      return false;
    }
  },
  resetApiKey: async () => {
    set({ saving: true, message: "" });
    try {
      const response = await fetch("/api/settings", { method: "DELETE" });
      if (!response.ok) {
        throw await responseError(response, "API 키를 초기화하지 못했습니다.");
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: "직접 입력한 API 키를 초기화했습니다.",
      });
      return true;
    } catch (error) {
      set({
        saving: false,
        message: error instanceof Error
          ? error.message
          : "API 키를 초기화하지 못했습니다.",
      });
      return false;
    }
  },
  setMockMode: (mockMode) => {
    window.localStorage.setItem(MOCK_MODE_STORAGE_KEY, String(mockMode));
    set({ mockMode });
  },
}));
