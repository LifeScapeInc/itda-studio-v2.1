"use client";
import { create } from "zustand";
import { cloudRequest } from "@/system/cloud/client";
import { reportCloudError } from "@/stores/useCloudSyncStore";
import { addTokenUsage, dateKey, EMPTY_TOKEN_USAGE, hasTokenUsage, UNCLASSIFIED_USAGE_CONTEXT, type TokenUsage, type TokenUsageContext, type TokenUsageRecord } from "@/system/usage/token-usage";
export type DailyTokenUsage = Record<string, TokenUsage>;
type TokenUsageStore = {
    dailyUsage: DailyTokenUsage;
    records: TokenUsageRecord[];
    hydrated: boolean;
    hydrate: () => void;
    recordUsage: (usage: TokenUsage, context?: TokenUsageContext, occurredAt?: Date) => void;
};
function daily(records: TokenUsageRecord[]) { const result: DailyTokenUsage = {}; for (const r of records) {
    const k = dateKey(new Date(r.occurredAt));
    result[k] = addTokenUsage(result[k] ?? EMPTY_TOKEN_USAGE, r.usage);
} return result; }
let loading: Promise<void> | null = null;
export const useTokenUsageStore = create<TokenUsageStore>((set, get) => ({
    dailyUsage: {}, records: [], hydrated: false,
    hydrate: () => {
        if (loading)
            return;
        loading = cloudRequest<TokenUsageRecord[]>("usage").then(remote => { const records = [...new Map([...remote, ...get().records].map(r => [r.id, r])).values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)); set({ records, dailyUsage: daily(records), hydrated: true }); }).catch(error => reportCloudError(error, async () => { get().hydrate(); await loading; })).finally(() => { loading = null; });
    },
    recordUsage: (usage, context = UNCLASSIFIED_USAGE_CONTEXT, occurredAt = new Date()) => {
        if (!hasTokenUsage(usage))
            return;
        const record = { id: crypto.randomUUID(), occurredAt: occurredAt.toISOString(), usage, context };
        const records = [...get().records, record];
        set({ records, dailyUsage: daily(records) });
        const save = async () => { await cloudRequest("usage", record); };
        void save().catch(error => reportCloudError(error, save));
    }
}));
