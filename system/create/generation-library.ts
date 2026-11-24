import type { BrandSelection } from "@/system/brand/brand-library";
import type { GenerationShot } from "@/system/create/generation-shots";
import { cloneBatch, type BatchEntry } from "./generation-batch";
import type {
  AngleVariationId,
  ContentSetId,
  GenerationQuality,
} from "@/system/create/generation-options";

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
  id: string;
  projectId?: string | null;
  createdAt: string;
  title: string;
  shots: LibraryGenerationShot[];
};

export function belongsToProject(
  history: GenerationHistorySet,
  projectId: string | null,
): boolean {
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

const DATABASE_NAME = "itda-studio-generation-library";
const STORE_NAME = "library";
const LIBRARY_KEY = "generation-history";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadGenerationHistory(): Promise<GenerationHistorySet[]> {
  if (typeof indexedDB === "undefined") return [];

  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(LIBRARY_KEY);
    request.onsuccess = () => resolve(
      Array.isArray(request.result) ? normalizeHistory(request.result as GenerationHistorySet[]) : [],
    );
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveGenerationHistory(
  history: GenerationHistorySet[],
): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(normalizeHistory(history), LIBRARY_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export function getBookmarkedImages(
  history: GenerationHistorySet[],
): LibraryGenerationShot[] {
  return history.flatMap((set) => set.shots).filter(
    (shot) => shot.bookmarked && shot.status === "done" && shot.imageUrl,
  );
}
