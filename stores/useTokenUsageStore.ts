"use client";

import { create } from "zustand";
import {
  addTokenUsage,
  dateKey,
  EMPTY_TOKEN_USAGE,
  hasTokenUsage,
  isTokenUsage,
  isTokenUsageRecord,
  UNCLASSIFIED_USAGE_CONTEXT,
  type TokenUsage,
  type TokenUsageContext,
  type TokenUsageRecord,
} from "@/system/usage/token-usage";
import { normalizeCutUsageContext } from "@/system/usage/token-usage-context";

const STORAGE_KEY = "itda-studio-v2.1:token-usage-by-day";
const RECORDS_STORAGE_KEY = "itda-studio-v2.1:token-usage-records";

export type DailyTokenUsage = Record<string, TokenUsage>;

type TokenUsageStore = {
  dailyUsage: DailyTokenUsage;
  records: TokenUsageRecord[];
  hydrated: boolean;
  hydrate: () => void;
  recordUsage: (
    usage: TokenUsage,
    context?: TokenUsageContext,
    occurredAt?: Date,
  ) => void;
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

function readRecords(): TokenUsageRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isTokenUsageRecord).map(record => ({
          ...record,
          context: normalizeCutUsageContext(record.context),
        }))
      : [];
  } catch {
    return [];
  }
}

function writeRecords(records: TokenUsageRecord[]): void {
  window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
}

function usageRecordId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `usage-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useTokenUsageStore = create<TokenUsageStore>((set, get) => ({
  dailyUsage: {},
  records: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) {
      return;
    }

    const records = readRecords();
    writeRecords(records);
    set({
      dailyUsage: readUsage(),
      records,
      hydrated: true,
    });
  },
  recordUsage: (
    usage,
    context = UNCLASSIFIED_USAGE_CONTEXT,
    occurredAt = new Date(),
  ) => {
    if (!hasTokenUsage(usage) || typeof window === "undefined") {
      return;
    }

    const stored = get().hydrated ? get().dailyUsage : readUsage();
    const key = dateKey(occurredAt);
    const dailyUsage = {
      ...stored,
      [key]: addTokenUsage(stored[key] ?? EMPTY_TOKEN_USAGE, usage),
    };
    const storedRecords = get().hydrated ? get().records : readRecords();
    const records = [
      ...storedRecords,
      {
        id: usageRecordId(),
        occurredAt: occurredAt.toISOString(),
        usage,
        context,
      },
    ];
    writeUsage(dailyUsage);
    writeRecords(records);
    set({ dailyUsage, records, hydrated: true });
  },
}));
