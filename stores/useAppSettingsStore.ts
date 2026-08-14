"use client";

import { create } from "zustand";
import type {
  AppSettingsStatus,
  OpenAiApiKeyMode,
} from "@/system/server/app-settings";

const TOKEN_STORAGE_KEY = "itda-studio-v2.1:estimated-tokens";
const MOCK_MODE_STORAGE_KEY = "itda-studio-v2.1:mock-mode";
const STARTING_TOKENS = 12_500;

type AppSettingsStore = {
  status: AppSettingsStatus | null;
  estimatedTokens: number;
  mockMode: boolean;
  loading: boolean;
  saving: boolean;
  message: string;
  loadStatus: () => Promise<void>;
  setApiKeyMode: (mode: OpenAiApiKeyMode) => Promise<boolean>;
  saveApiKey: (apiKey: string) => Promise<boolean>;
  resetApiKey: () => Promise<boolean>;
  spendTokens: (amount: number) => void;
  setMockMode: (mockMode: boolean) => void;
};

function readEstimatedTokens(): number {
  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (raw === null) {
    return STARTING_TOKENS;
  }

  const stored = Number(raw);
  return Number.isFinite(stored) && stored >= 0 ? stored : STARTING_TOKENS;
}

function saveEstimatedTokens(value: number): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, String(value));
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  status: null,
  estimatedTokens: STARTING_TOKENS,
  mockMode: false,
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
        estimatedTokens: readEstimatedTokens(),
        mockMode: window.localStorage.getItem(MOCK_MODE_STORAGE_KEY) === "true",
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
      if (!response.ok) throw new Error();

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: openAiApiKeyMode === "env"
          ? "환경변수 API 키 사용을 선택했습니다."
          : "직접 입력 API 키 사용을 선택했습니다.",
      });
      return true;
    } catch {
      set({ saving: false, message: "API 키 사용 방식을 변경하지 못했습니다." });
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
        throw new Error();
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: "직접 입력한 API 키를 저장하고 사용 방식으로 선택했습니다.",
      });
      return true;
    } catch {
      set({ saving: false, message: "API 키를 저장하지 못했습니다." });
      return false;
    }
  },
  resetApiKey: async () => {
    set({ saving: true, message: "" });
    try {
      const response = await fetch("/api/settings", { method: "DELETE" });
      if (!response.ok) {
        throw new Error();
      }

      const status = (await response.json()) as AppSettingsStatus;
      set({
        status,
        saving: false,
        message: "직접 입력한 API 키를 초기화했습니다.",
      });
      return true;
    } catch {
      set({ saving: false, message: "API 키를 초기화하지 못했습니다." });
      return false;
    }
  },
  spendTokens: (amount) => {
    const estimatedTokens = Math.max(0, get().estimatedTokens - amount);
    saveEstimatedTokens(estimatedTokens);
    set({ estimatedTokens });
  },
  setMockMode: (mockMode) => {
    window.localStorage.setItem(MOCK_MODE_STORAGE_KEY, String(mockMode));
    set({ mockMode });
  },
}));
