"use client";
import { create } from "zustand";
type SyncState = {
    error: string | null;
    restoring: number;
    retry: (() => Promise<void>) | null;
    clear: () => void;
};
export const useCloudSyncStore = create<SyncState>(set => ({ error: null, restoring: 0, retry: null, clear: () => set({ error: null, retry: null }) }));
export function reportCloudError(error: unknown, retry?: () => Promise<void>) { useCloudSyncStore.setState({ error: error instanceof Error ? error.message : "클라우드 저장에 실패했습니다.", retry: retry ?? null }); }
