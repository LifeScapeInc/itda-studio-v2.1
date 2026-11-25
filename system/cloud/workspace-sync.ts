"use client";
import { useCreateStore, captureWorkspace as captureCreate, type CreateWorkspaceSnapshot } from "@/stores/useCreateStore";
import { useDetailPageStore, captureWorkspace as captureDetail, type DetailWorkspaceSnapshot } from "@/stores/useDetailPageStore";
import { cloudRequest, portableState, restoreState } from "./client";
import { flushHistorySaves } from "@/system/create/generation-library";
import { reportCloudError, useCloudSyncStore } from "@/stores/useCloudSyncStore";
type Adapter = {
    kind: "studio_cut" | "detail_page";
    project: () => string | null;
    capture: () => unknown;
    apply: (id: string | null, state: unknown) => void;
    subscribe: (callback: () => void) => () => void;
};
type Slot = {
    projectId: string | null;
    version: number;
    loaded: boolean;
    loading?: Promise<void>;
    pending?: unknown;
    timer?: ReturnType<typeof setTimeout>;
    queue: Promise<void>;
};
function knownState(value: unknown, example: unknown) {
    const source = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(example as object).filter(key => key in source).map(key => [key, source[key]]));
}
function durable(value: unknown): unknown {
    if (Array.isArray(value))
        return value.map(durable);
    if (value instanceof File)
        return value;
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).filter(([k]) => !['isGenerating', 'isPlanning', 'isTemplatePlanning', 'isPageGenerating', 'planningProgressStage', 'planningStartedAt', 'templatePlanningStartedAt', 'pageGenerationStartedAt'].includes(k)).map(([k, v]) => [k, durable(v)]));
    return value;
}
export function installWorkspaceSync() {
    const adapters: Adapter[] = [{
            kind: "studio_cut", project: () => useCreateStore.getState().workspaceProjectId, capture: () => captureCreate(useCreateStore.getState()), subscribe: callback => useCreateStore.subscribe(callback),
            apply: (id, value) => {
                const snapshot = knownState(value, captureCreate(useCreateStore.getState())) as CreateWorkspaceSnapshot;
                const history = useCreateStore.getState().generationHistory.find(h => h.id === snapshot.activeHistoryId && (h.projectId ?? null) === id);
                if (snapshot.activeHistoryId) {
                    snapshot.activeHistoryId = history?.id ?? null;
                    snapshot.generationShots = history?.shots ?? [];
                    snapshot.selectedShotIds = (snapshot.selectedShotIds ?? []).filter(id => history?.shots.some(s => s.id === id));
                    if (!history?.shots.some(s => s.id === snapshot.selectedShotId))
                        snapshot.selectedShotId = null;
                }
                useCreateStore.setState(s => s.workspaceProjectId === id ? { ...snapshot } : { workspaceSnapshots: { ...s.workspaceSnapshots, [id ?? "__unscoped__"]: snapshot } });
            }
        }, {
            kind: "detail_page", project: () => useDetailPageStore.getState().workspaceProjectId, capture: () => captureDetail(useDetailPageStore.getState()), subscribe: callback => useDetailPageStore.subscribe(callback),
            apply: (id, value) => { const snapshot = { ...knownState(value, captureDetail(useDetailPageStore.getState())) as DetailWorkspaceSnapshot, isPlanning: false, isTemplatePlanning: false, isPageGenerating: false }; useDetailPageStore.setState(s => s.workspaceProjectId === id ? snapshot : { workspaceSnapshots: { ...s.workspaceSnapshots, [id ?? "__unscoped_detail_page__"]: snapshot } }); }
        }];
    const cleanups: (() => void)[] = [];
    const flushes: (() => void)[] = [];
    let disposed = false;
    for (const adapter of adapters) {
        const slots = new Map<string, Slot>();
        let applying = false;
        let previousId = adapter.project();
        const slotFor = (projectId: string | null) => {
            const key = projectId ?? "unscoped";
            if (!slots.has(key))
                slots.set(key, { projectId, version: 0, loaded: false, queue: Promise.resolve() });
            return slots.get(key)!;
        };
        const flush = (slot: Slot): Promise<void> => {
            if (slot.timer) {
                clearTimeout(slot.timer);
                slot.timer = undefined;
            }
            if (!slot.loaded || !slot.pending)
                return slot.queue;
            const snapshot = slot.pending;
            slot.pending = undefined;
            const task = slot.queue.catch(() => undefined).then(async () => {
                await flushHistorySaves();
                const state = await portableState(durable(snapshot));
                const result = await cloudRequest<{
                    version: number;
                }>("workspace", { kind: adapter.kind, projectId: slot.projectId, state, version: slot.version });
                slot.version = result.version;
            });
            slot.queue = task;
            void task.catch(error => { slot.pending ??= snapshot; reportCloudError(error, () => flush(slot)); });
            return task;
        };
        const load = (projectId: string | null): Promise<void> => {
            const slot = slotFor(projectId);
            if (slot.loaded)
                return Promise.resolve();
            if (slot.loading)
                return slot.loading;
            useCloudSyncStore.setState(s => ({ restoring: s.restoring + 1 }));
            slot.loading = (async () => {
                const search = new URLSearchParams({ kind: adapter.kind });
                if (projectId)
                    search.set("projectId", projectId);
                const response = await cloudRequest<{
                    state: unknown;
                    version: number;
                }>(`workspace?${search}`);
                if (disposed)
                    return;
                const snapshot = response.state ? await restoreState(response.state) : null;
                slot.version = response.version;
                if (snapshot) {
                    applying = true;
                    try {
                        adapter.apply(projectId, snapshot);
                    }
                    finally {
                        applying = false;
                    }
                }
                slot.loaded = true;
            })().catch(error => { reportCloudError(error, () => load(projectId)); throw error; }).finally(() => { slot.loading = undefined; useCloudSyncStore.setState(s => ({ restoring: Math.max(0, s.restoring - 1) })); });
            return slot.loading;
        };
        cleanups.push(adapter.subscribe(() => {
            if (applying || disposed)
                return;
            const projectId = adapter.project();
            if (previousId !== projectId) {
                void flush(slotFor(previousId)).catch(() => undefined);
                previousId = projectId;
                void load(projectId).catch(() => undefined);
                return;
            }
            const slot = slotFor(projectId);
            if (!slot.loaded)
                return;
            slot.pending = adapter.capture();
            if (slot.timer)
                clearTimeout(slot.timer);
            slot.timer = setTimeout(() => void flush(slot).catch(() => undefined), 600);
        }));
        void load(previousId).catch(() => undefined);
        flushes.push(() => {
            for (const slot of slots.values())
                void flush(slot).catch(() => undefined);
        });
    }
    const flushAll = () => flushes.forEach(flush => flush());
    const onVisibility = () => {
        if (document.visibilityState === "hidden")
            flushAll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushAll);
    return () => { flushAll(); disposed = true; cleanups.forEach(clean => clean()); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", flushAll); };
}
