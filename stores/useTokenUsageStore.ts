"use client";

import { create } from "zustand";
import {
  addTokenUsage,
  dateKey,
  EMPTY_TOKEN_USAGE,
  hasTokenUsage,
  isTokenUsage,
  type TokenUsage,
} from "@/system/usage/token-usage";

const STORAGE_KEY = "itda-studio-v2.1:token-usage-by-day";

export type DailyTokenUsage = Record<string, TokenUsage>;

type TokenUsageStore = {
  dailyUsage: DailyTokenUsage;
  hydrated: boolean;
  hydrate: () => void;
  recordUsage: (usage: TokenUsage, occurredAt?: Date) => void;
};

function readUsage(): DailyTokenUsage {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, TokenUsage] => (
        /^\d{4}-\d{2}-\d{2}$/.test(entry[0]) && isTokenUsage(entry[1])
      )),
    );
  } catch {
    return {};
  }
}

function writeUsage(dailyUsage: DailyTokenUsage): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyUsage));
}

export const useTokenUsageStore = create<TokenUsageStore>((set, get) => ({
  dailyUsage: {},
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) {
      return;
    }

    set({ dailyUsage: readUsage(), hydrated: true });
  },
  recordUsage: (usage, occurredAt = new Date()) => {
    if (!hasTokenUsage(usage) || typeof window === "undefined") {
      return;
    }

    const stored = get().hydrated ? get().dailyUsage : readUsage();
    const key = dateKey(occurredAt);
    const dailyUsage = {
      ...stored,
      [key]: addTokenUsage(stored[key] ?? EMPTY_TOKEN_USAGE, usage),
    };
    writeUsage(dailyUsage);
    set({ dailyUsage, hydrated: true });
  },
}));
