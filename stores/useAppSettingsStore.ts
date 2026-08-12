"use client";

import { create } from "zustand";
import type { AppSettingsStatus } from "@/system/server/app-settings";

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
        message: status.openAiApiKeySource === "env"
          ? "직접 입력한 키를 2순위 fallback으로 저장했습니다."
          : "API 키를 로컬에 저장했습니다.",
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
        message: status.openAiApiKeySource === "env"
          ? "저장 키를 초기화했습니다. 환경변수 키는 계속 사용됩니다."
          : "저장된 API 키를 초기화했습니다.",
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
