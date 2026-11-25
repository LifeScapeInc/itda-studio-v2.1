import { cloudRequest, portableState } from "@/system/cloud/client";
import { reportCloudError } from "@/stores/useCloudSyncStore";
import type { BrandSelection } from "@/system/brand/brand-library";
import type { GenerationShot } from "@/system/create/generation-shots";
import { cloneBatch, type BatchEntry } from "./generation-batch";
import type { AngleVariationId, ContentSetId, GenerationQuality, } from "@/system/create/generation-options";
export type GenerationInputImage = {
    kind: "product" | "reference";
    label: string;
    imageUrl: string;
};
export type GenerationSettingsSnapshot = {
    brandSelection?: BrandSelection | null;
    batchEntries?: BatchEntry[];
    contentSet: ContentSetId | null;
    angleVariationIds: AngleVariationId[];
    freeCount: number;
    quality: GenerationQuality;
    editMode?: string;
    light: string;
    mood: string;
    props: string[];
    prompt: string;
};
export type GenerationImageMetadata = {
    finalPrompt: string;
    generatedAt: string;
    aiModel: string;
    variationType: string;
    quality: string;
    editMode: string;
    light: string;
    mood: string;
    props: string[];
    additionalDirection: string;
    imageSize: string;
    inputImages?: GenerationInputImage[];
    generationSettings?: GenerationSettingsSnapshot;
};
export type LibraryGenerationShot = GenerationShot & {
    metadata: GenerationImageMetadata;
    bookmarked: boolean;
};
export type GenerationHistorySet = {
    version?: number;
    id: string;
    projectId?: string | null;
    createdAt: string;
    title: string;
    shots: LibraryGenerationShot[];
};
export function belongsToProject(history: GenerationHistorySet, projectId: string | null): boolean {
    return (history.projectId ?? null) === projectId;
}
// Normalize retired free-generation presets when loading or saving older history.
function normalizeHistory(history: GenerationHistorySet[]): GenerationHistorySet[] {
    return history.map(set => ({ ...set, shots: set.shots.map(shot => {
            const settings = shot.metadata.generationSettings;
            return settings?.batchEntries ? { ...shot, metadata: { ...shot.metadata, generationSettings: {
                        ...settings, batchEntries: cloneBatch(settings.batchEntries),
                    } } } : shot;
        }) }));
}
let queue: Promise<void> = Promise.resolve();
const baseline = new Map<string, string>();
const versions = new Map<string, number>();
const deleted = new Set<string>();
let latestSnapshot: GenerationHistorySet[] = [];
let loading: Promise<GenerationHistorySet[]> | null = null;
export function loadGenerationHistory(): Promise<GenerationHistorySet[]> {
    if (loading)
        return loading;
    loading = cloudRequest<GenerationHistorySet[]>("histories").then(rows => {
        const history = normalizeHistory(rows);
        for (const h of history) {
            versions.set(h.id, h.version ?? 1);
            baseline.set(h.id, JSON.stringify({ ...h, version: undefined }));
        }
        return history;
    }).finally(() => { loading = null; });
    return loading;
}
export function saveGenerationHistory(history: GenerationHistorySet[]): Promise<void> {
    const snapshot = structuredClone(history);
    latestSnapshot = snapshot;
    const operation = async () => {
        for (const h of normalizeHistory(snapshot)) {
            if (deleted.has(h.id))
                continue;
            const signature = JSON.stringify({ ...h, version: undefined });
            if (baseline.get(h.id) === signature)
                continue;
            const portable = await portableState({ ...h, version: versions.get(h.id) ?? h.version ?? 0 }) as GenerationHistorySet;
            const result = await cloudRequest<{
                version: number;
            }>("histories", portable);
            versions.set(h.id, result.version);
            baseline.set(h.id, signature);
        }
    };
    const task = queue.catch(() => undefined).then(operation);
    queue = task;
    void task.catch(error => reportCloudError(error, () => saveGenerationHistory(latestSnapshot)));
    return task;
}
export async function flushHistorySaves() {
    try { await queue; }
    catch { await saveGenerationHistory(latestSnapshot); }
}
export async function deleteGenerationHistory(id: string) {
    deleted.add(id);
    await queue.catch(() => undefined);
    try {
        await cloudRequest("delete-history", { id });
        baseline.delete(id);
        versions.delete(id);
    }
    catch (error) {
        deleted.delete(id);
        throw error;
    }
}
export async function loadBookmarkedImages() { await queue.catch(() => undefined); return cloudRequest<LibraryGenerationShot[]>("bookmarks"); }
export function getBookmarkedImages(history: GenerationHistorySet[]): LibraryGenerationShot[] {
    return history.flatMap((set) => set.shots).filter((shot) => shot.bookmarked && shot.status === "done" && shot.imageUrl);
}
