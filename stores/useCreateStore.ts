"use client";

import { create } from "zustand";
import type { BrandSelection } from "@/system/brand/brand-library";
import type {
  AngleVariationId,
  ContentSetId,
  GenerationQuality,
} from "@/system/create/generation-options";
import {
  buildGenerationPrompts,
  type GenerationPrompt,
} from "@/system/create/generation-prompt";
import {
  createGenerationShots,
  type GenerationShot,
} from "@/system/create/generation-shots";
import {
  FREE_GENERATION_CONCURRENCY,
  runGenerationQueue,
  scheduleGeneration,
} from "@/system/create/generation-runner";
import type {
  GenerationApiError,
  GenerationApiResponse,
} from "@/system/create/generation-api";
import { optimizeImageDataUrl } from "@/system/create/image-files";
import {
  belongsToProject,
  loadGenerationHistory,
  saveGenerationHistory,
  type GenerationHistorySet,
  type LibraryGenerationShot,
} from "@/system/create/generation-library";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";
import {
  ANGLE_VARIATION_OPTIONS,
  CONTENT_SET_OPTIONS,
  EDIT_MODE_OPTIONS,
  QUALITY_OPTIONS,
} from "@/system/create/generation-options";
import { cutGenerationUsageContext } from "@/system/usage/token-usage-context";
import { cloneBatch, newMake, normalizeQuantity, getBatchLabel, type BatchEntry, type GenerationMake, type PresetId } from "@/system/create/generation-batch";

export type GenerationRunResult = {
  usedActualGeneration: boolean;
  actualCompleted: number;
  completed: number;
  failed: number;
};

type CreateWorkspaceSnapshot = {
  draftTitle: string;
  batchEntries: BatchEntry[];
  productImage: string | null;
  referenceImage: string | null;
  brandSelection: BrandSelection | null;
  contentSet: ContentSetId | null;
  angleVariationIds: AngleVariationId[];
  freeCount: number;
  quality: GenerationQuality;
  editMode: string;
  light: string;
  mood: string;
  props: string[];
  prompt: string;
  generationRequested: boolean;
  generationMessage: string;
  lastGenerationPrompts: GenerationPrompt[];
  generationShots: GenerationShot[];
  activeHistoryId: string | null;
  selectedShotId: string | null;
  selectedShotIds: string[];
  selectionAnchorId: string | null;
};

type CreateStore = {
  reevaluatingIds: string[];
  reevaluateShot: (id: string) => Promise<void>;
  draftTitle: string;
  renameDraft: (title: string) => void;
  renameHistory: (id: string, title: string) => void;
  renameShot: (id: string, title: string) => void;
  generationPanelTab: "settings" | "evaluation";
  setGenerationPanelTab: (tab: "settings" | "evaluation") => void;
  batchEntries: BatchEntry[];
  addMake: () => void;
  addPreset: (presetId: PresetId) => void;
  updateMake: (id: string, settings: Partial<Pick<GenerationMake, "purpose" | "composition" | "ratio">>) => void;
  setEntryQuantity: (id: string, quantity: number) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
  workspaceProjectId: string | null;
  workspaceSnapshots: Record<string, CreateWorkspaceSnapshot>;
  productImage: string | null;
  referenceImage: string | null;
  brandSelection: BrandSelection | null;
  contentSet: ContentSetId | null;
  angleVariationIds: AngleVariationId[];
  freeCount: number;
  quality: GenerationQuality;
  editMode: string;
  light: string;
  mood: string;
  props: string[];
  prompt: string;
  isGenerating: boolean;
  generationRequested: boolean;
  generationMessage: string;
  lastGenerationPrompts: GenerationPrompt[];
  generationShots: GenerationShot[];
  generationHistory: GenerationHistorySet[];
  activeHistoryId: string | null;
  selectedShotId: string | null;
  selectedShotIds: string[];
  selectionAnchorId: string | null;
  libraryHydrated: boolean;
  setProjectContext: (projectId: string | null) => void;
  setProductImage: (image: string | null) => void;
  setReferenceImage: (image: string | null) => void;
  setBrandSelection: (brand: BrandSelection | null) => void;
  setContentSet: (contentSet: ContentSetId) => void;
  toggleAngleVariation: (angleVariation: AngleVariationId) => void;
  setFreeCount: (count: number) => void;
  setQuality: (quality: GenerationQuality) => void;
  setEditMode: (editMode: string) => void;
  setLight: (light: string) => void;
  setMood: (mood: string) => void;
  toggleProp: (prop: string) => void;
  setPrompt: (prompt: string) => void;
  hydrateLibrary: () => Promise<void>;
  selectShot: (shotId: string | null, modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => void;
  navigateSelection: (direction: -1 | 1) => void;
  clearStaging: () => void;
  reuseGenerationSettings: (shot: LibraryGenerationShot) => void;
  restoreHistory: (historyId: string) => void;
  deleteHistory: (historyId: string) => void;
  toggleBookmark: (shotId: string) => void;
  setBookmarks: (shotIds: string[], bookmarked: boolean) => void;
  retryShot: (shotId: string, mockMode: boolean, regenerate?: boolean) => Promise<void>;
  requestGeneration: (mockMode: boolean) => Promise<GenerationRunResult>;
};

const UNSCOPED_WORKSPACE_KEY = "__unscoped__";

function getWorkspaceKey(projectId: string | null): string {
  return projectId ?? UNSCOPED_WORKSPACE_KEY;
}

function createEmptyWorkspace(): CreateWorkspaceSnapshot {
  return {
    draftTitle: "새 생성",
    batchEntries: [newMake("initial")],
    productImage: null,
    referenceImage: null,
    brandSelection: null,
    contentSet: null,
    angleVariationIds: [],
    freeCount: 1,
    quality: "medium",
    editMode: "swap",
    light: "원본 유지",
    mood: "원본 유지",
    props: [],
    prompt: "",
    generationRequested: false,
    generationMessage: "",
    lastGenerationPrompts: [],
    generationShots: [],
    activeHistoryId: null,
    selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
  };
}

function captureWorkspace(state: CreateStore): CreateWorkspaceSnapshot {
  return {
    draftTitle: state.draftTitle,
    batchEntries: cloneBatch(state.batchEntries),
    productImage: state.productImage,
    referenceImage: state.referenceImage,
    brandSelection: state.brandSelection ? { ...state.brandSelection } : null,
    contentSet: state.contentSet,
    angleVariationIds: [...state.angleVariationIds],
    freeCount: state.freeCount,
    quality: state.quality,
    editMode: state.editMode,
    light: state.light,
    mood: state.mood,
    props: [...state.props],
    prompt: state.prompt,
    generationRequested: state.generationRequested,
    generationMessage: state.generationMessage,
    lastGenerationPrompts: [...state.lastGenerationPrompts],
    generationShots: state.generationShots,
    activeHistoryId: state.activeHistoryId,
    selectedShotId: state.selectedShotId,
    selectedShotIds: [...state.selectedShotIds],
    selectionAnchorId: state.selectionAnchorId,
  };
}

function restoreLatestHistory(
  workspace: CreateWorkspaceSnapshot,
  history: GenerationHistorySet[],
  projectId: string | null,
  restoreProjectLatest = false,
): CreateWorkspaceSnapshot {
  const scopedHistory = history.filter(item => belongsToProject(item, projectId));
  const activeHistory = scopedHistory.find(
    item => item.id === workspace.activeHistoryId,
  ) ?? (workspace.generationRequested || restoreProjectLatest
    ? scopedHistory[0]
    : undefined);

  if (!activeHistory) return workspace;

  return {
    ...workspace,
    generationRequested: true,
    generationShots: activeHistory.shots,
    selectedShotIds: workspace.selectedShotIds.filter(id => activeHistory.shots.some(shot => shot.id === id && shot.status === "done" && shot.imageUrl)),
    activeHistoryId: activeHistory.id,
    selectedShotId: activeHistory.shots.find(
      shot => shot.id === workspace.selectedShotId && shot.status === "done",
    )?.id ?? null,
    generationMessage: `${new Date(activeHistory.createdAt).toLocaleString("ko-KR")} 생성 결과`,
  };
}

function historySettings(shot: LibraryGenerationShot): Partial<CreateWorkspaceSnapshot> {
    const metadata = shot.metadata;
    const snapshot = metadata.generationSettings;
    const productImage = metadata.inputImages?.find(
      (image) => image.kind === "product",
    )?.imageUrl ?? null;
    const referenceImage = metadata.inputImages?.find(
      (image) => image.kind === "reference",
    )?.imageUrl ?? null;
    const variationLabel = metadata.variationType.split(" · ")[0];
    const fallbackContentSet = CONTENT_SET_OPTIONS.find(
      (option) => option.label === variationLabel,
    )?.id ?? null;
    const fallbackAngle = variationLabel === "앵글 변주"
      ? ANGLE_VARIATION_OPTIONS.find(
          (option) => metadata.variationType.includes(option.label),
        )?.id
      : undefined;
    const fallbackQuality = QUALITY_OPTIONS.find(
      (option) => option.id === metadata.quality || option.label === metadata.quality,
    )?.id ?? "medium";
    const fallbackEditMode = EDIT_MODE_OPTIONS.find(
      (option) => option.id === metadata.editMode || option.label === metadata.editMode,
    )?.id;

    return {
      batchEntries: snapshot?.batchEntries ? cloneBatch(snapshot.batchEntries) : (() => {
        const presetId = fallbackAngle ? "angle" : snapshot?.contentSet ?? fallbackContentSet;
        return presetId && presetId !== "free"
          ? [{ id: crypto.randomUUID(), kind: "preset" as const, presetId, quantity: 1 }]
          : [{ ...newMake(), quantity: normalizeQuantity(snapshot?.freeCount ?? 1) }];
      })(),
      productImage,
      referenceImage,
      brandSelection: snapshot?.brandSelection ? { ...snapshot.brandSelection } : null,
      contentSet: snapshot?.contentSet ?? fallbackContentSet,
      angleVariationIds: snapshot?.angleVariationIds
        ?? (fallbackAngle ? [fallbackAngle] : []),
      freeCount: snapshot?.freeCount ?? 1,
      quality: snapshot?.quality ?? fallbackQuality,
      editMode: snapshot?.editMode ?? fallbackEditMode ?? "swap",
      light: snapshot?.light ?? metadata.light,
      mood: snapshot?.mood ?? metadata.mood,
      props: [...(snapshot?.props ?? metadata.props)],
      prompt: snapshot?.prompt
        ?? (metadata.additionalDirection === "없음"
          ? ""
          : metadata.additionalDirection),
    };
}

const queuedRetries = new Set<string>();
let batchRunning = false;

export const useCreateStore = create<CreateStore>((set, get) => ({
  reevaluatingIds: [],
  reevaluateShot: async id => {
    const state = get();
    if (state.reevaluatingIds.includes(id)) return;
    const history = state.generationHistory.find(item => item.shots.some(shot => shot.id === id));
    const shot = history?.shots.find(shot => shot.id === id && shot.status === "done" && shot.imageUrl);
    if (!shot) return;
    const original = shot.metadata.inputImages?.find(image => image.kind === "product")?.imageUrl;
    set(current => ({ reevaluatingIds: [...current.reevaluatingIds, id] }));
    let fidelity: NonNullable<GenerationShot["fidelity"]>;
    try {
      if (!original) throw new Error("원본 제품 이미지가 없어 재평가할 수 없습니다.");
      const response = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ originalImage: original, generatedImage: shot.imageUrl }) });
      const result = await response.json();
      if (!response.ok || !result.fidelity) throw new Error(result.error ?? "재평가에 실패했습니다.");
      fidelity = result.fidelity;
    } catch (error) { fidelity = { status: "unavailable", reason: error instanceof Error ? error.message : "재평가에 실패했습니다." }; }
    set(current => {
      const update = <T extends GenerationShot>(image: T): T => image.id === id && image.status === "done" && image.imageUrl === shot.imageUrl ? { ...image, fidelity } : image;
      return { generationHistory: current.generationHistory.map(item => ({ ...item, shots: item.shots.map(update) })), generationShots: current.generationShots.map(update), reevaluatingIds: current.reevaluatingIds.filter(value => value !== id) };
    });
    await saveGenerationHistory(get().generationHistory);
  },
  draftTitle: "새 생성",
  renameDraft: title => { if (title.trim()) set({ draftTitle: title.trim() }); },
  renameHistory: (id, title) => {
    if (!title.trim()) return;
    const generationHistory = get().generationHistory.map(history => history.id === id ? { ...history, title: title.trim() } : history);
    set({ generationHistory });
    void saveGenerationHistory(generationHistory);
  },
  renameShot: (id, title) => {
    if (!title.trim()) return;
    const rename = <T extends GenerationShot>(shot: T): T => shot.id === id ? { ...shot, label: title.trim() } : shot;
    const generationHistory = get().generationHistory.map(history => ({ ...history, shots: history.shots.map(rename) }));
    set({ generationHistory, generationShots: get().generationShots.map(rename) });
    void saveGenerationHistory(generationHistory);
  },
  generationPanelTab: "settings",
  setGenerationPanelTab: generationPanelTab => set({ generationPanelTab }),
  batchEntries: [newMake("initial")],
  addMake: () => set(state => ({ batchEntries: [...state.batchEntries, newMake()] })),
  addPreset: presetId => set(state => ({ batchEntries: [...state.batchEntries, { id: crypto.randomUUID(), kind: "preset", presetId, quantity: 1 }] })),
  updateMake: (id, settings) => set(state => ({ batchEntries: state.batchEntries.map(entry => entry.id === id && entry.kind === "make" ? { ...entry, ...settings } : entry) })),
  setEntryQuantity: (id, quantity) => set(state => ({ batchEntries: state.batchEntries.map(entry => entry.id === id ? { ...entry, quantity: normalizeQuantity(quantity) } : entry) })),
  removeEntry: id => set(state => ({ batchEntries: state.batchEntries.filter(entry => entry.id !== id) })),
  clearEntries: () => set({ batchEntries: [] }),
  workspaceProjectId: null,
  workspaceSnapshots: {},
  productImage: null,
  referenceImage: null,
  brandSelection: null,
  contentSet: null,
  angleVariationIds: [],
  freeCount: 1,
  quality: "medium",
  editMode: "swap",
  light: "원본 유지",
  mood: "원본 유지",
  props: [],
  prompt: "",
  isGenerating: false,
  generationRequested: false,
  generationMessage: "",
  lastGenerationPrompts: [],
  generationShots: [],
  generationHistory: [],
  activeHistoryId: null,
  selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
  libraryHydrated: false,
  setProjectContext: (workspaceProjectId) => {
    const current = get();
    if (current.workspaceProjectId === workspaceProjectId) return;

    const workspaceSnapshots = {
      ...current.workspaceSnapshots,
      [getWorkspaceKey(current.workspaceProjectId)]: captureWorkspace(current),
    };
    const storedWorkspace = workspaceSnapshots[getWorkspaceKey(workspaceProjectId)];
    const nextWorkspace = restoreLatestHistory(
      storedWorkspace ?? createEmptyWorkspace(),
      current.generationHistory,
      workspaceProjectId,
      !storedWorkspace && Boolean(workspaceProjectId),
    );

    set({
      ...nextWorkspace,
      workspaceProjectId,
      workspaceSnapshots,
    });
  },
  setProductImage: (productImage) => {
    set({ productImage, generationRequested: false });
  },
  setBrandSelection: (brandSelection) => set({ brandSelection }),
  setReferenceImage: (referenceImage) => {
    set({ referenceImage, generationRequested: false });
  },
  setContentSet: (contentSet) => {
    set({
      contentSet,
      angleVariationIds: [],
      generationRequested: false,
    });
  },
  toggleAngleVariation: (angleVariation) => {
    set((state) => ({
      contentSet: null,
      angleVariationIds: state.angleVariationIds.includes(angleVariation)
        ? state.angleVariationIds.filter((item) => item !== angleVariation)
        : [...state.angleVariationIds, angleVariation],
      generationRequested: false,
    }));
  },
  setFreeCount: (freeCount) => {
    set({ freeCount, generationRequested: false });
  },
  setQuality: (quality) => {
    set({ quality });
  },
  setEditMode: (editMode) => {
    set({ editMode });
  },
  setLight: (light) => {
    set({ light });
  },
  setMood: (mood) => {
    set({ mood });
  },
  toggleProp: (prop) => {
    set((state) => ({
      props: prop === "소품 없음"
        ? state.props.includes(prop) ? [] : [prop]
        : state.props.includes(prop)
          ? state.props.filter(item => item !== prop)
          : [...state.props.filter(item => item !== "소품 없음"), prop],
    }));
  },
  setPrompt: (prompt) => {
    set({ prompt });
  },
  hydrateLibrary: async () => {
    if (get().libraryHydrated) return;
    try {
      const generationHistory = await loadGenerationHistory();
      set(state => ({
        ...restoreLatestHistory(
          captureWorkspace(state),
          generationHistory,
          state.workspaceProjectId,
          Boolean(state.workspaceProjectId),
        ),
        generationHistory,
        libraryHydrated: true,
      }));
    } catch {
      set({ libraryHydrated: true });
    }
  },
  selectShot: (id, modifiers = {}) => set(state => {
    if (!id) return { selectedShotId: null, selectedShotIds: [], selectionAnchorId: null };
    const order = state.generationShots.filter(shot => shot.status === "done" && shot.imageUrl).map(shot => shot.id);
    if (!order.includes(id)) return {};
    const additive = modifiers.ctrlKey || modifiers.metaKey;
    let ids: string[];
    if (modifiers.shiftKey) {
      const anchor = order.indexOf(state.selectionAnchorId ?? state.selectedShotId ?? id);
      const end = order.indexOf(id), start = anchor < 0 ? end : anchor;
      const range = order.slice(Math.min(start, end), Math.max(start, end) + 1);
      ids = additive ? [...new Set([...state.selectedShotIds, ...range])] : range;
    } else ids = additive ? state.selectedShotIds.includes(id) ? state.selectedShotIds.filter(value => value !== id) : [...state.selectedShotIds, id] : [id];
    ids = order.filter(value => ids.includes(value));
    return { selectedShotIds: ids, selectedShotId: ids.includes(id) ? id : ids.at(-1) ?? null,
      selectionAnchorId: modifiers.shiftKey ? state.selectionAnchorId ?? id : id, generationPanelTab: "evaluation" };
  }),
  navigateSelection: direction => set(state => {
    const ids = state.generationShots.filter(shot => state.selectedShotIds.includes(shot.id) && shot.status === "done" && shot.imageUrl).map(shot => shot.id);
    const index = ids.indexOf(state.selectedShotId ?? "");
    return { selectedShotId: ids[Math.max(0, Math.min(ids.length - 1, index + direction))] ?? null };
  }),
  clearStaging: () => {
    set({
      activeHistoryId: null,
      generationRequested: false,
      generationShots: [],
      selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
      generationMessage: "",
    });
  },
  reuseGenerationSettings: (shot) => {

    set({
      ...historySettings(shot),
      activeHistoryId: null,
      generationRequested: false,
      generationShots: [],
      selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
      generationMessage: "",
    });
  },
  restoreHistory: (historyId) => {
    const history = get().generationHistory.find((item) => item.id === historyId);
    if (!history) return;
    set({
      ...(history.shots[0] ? historySettings(history.shots[0]) : {}),
      generationPanelTab: "settings",
      activeHistoryId: history.id,
      generationRequested: true,
      generationShots: history.shots,
      selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
      generationMessage: `${new Date(history.createdAt).toLocaleString("ko-KR")} 생성 결과`,
    });
  },
  deleteHistory: (historyId) => {
    const current = get();

    const generationHistory = current.generationHistory.filter(
      (history) => history.id !== historyId,
    );
    const deletedActiveHistory = current.activeHistoryId === historyId;
    const scopedHistory = generationHistory.filter(history => (
      belongsToProject(history, current.workspaceProjectId)
    ));
    const nextActiveHistory = deletedActiveHistory
      ? scopedHistory[0]
      : scopedHistory.find(
          (history) => history.id === current.activeHistoryId,
        );

    set({
      generationHistory,
      ...(deletedActiveHistory ? {
        activeHistoryId: nextActiveHistory?.id ?? null,
        generationRequested: Boolean(nextActiveHistory),
        generationShots: nextActiveHistory?.shots ?? [],
        selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
        generationMessage: nextActiveHistory
          ? `${new Date(nextActiveHistory.createdAt).toLocaleString("ko-KR")} 생성 결과`
          : "",
      } : {}),
    });
    void saveGenerationHistory(generationHistory);
  },
  setBookmarks: (shotIds, bookmarked) => {
    const ids = new Set(shotIds);
    const generationHistory = get().generationHistory.map(history => ({ ...history, shots: history.shots.map(shot => ids.has(shot.id) ? { ...shot, bookmarked } : shot) }));
    const generationShots = get().generationShots.map(shot => ids.has(shot.id) ? { ...shot, bookmarked } : shot);
    set({ generationHistory, generationShots });
    void saveGenerationHistory(generationHistory);
  },
  toggleBookmark: (shotId) => {
    set((state) => {
      const generationHistory = state.generationHistory.map((history) => ({
        ...history,
        shots: history.shots.map((shot) => shot.id === shotId
          ? { ...shot, bookmarked: !shot.bookmarked }
          : shot),
      }));
      const active = generationHistory.find(
        (history) => history.id === state.activeHistoryId,
      );
      void saveGenerationHistory(generationHistory);
      return {
        generationHistory,
        generationShots: active?.shots ?? state.generationShots,
      };
    });
  },
  retryShot: async (shotId, mockMode, regenerate = false) => {
    const current = get();
    if (queuedRetries.has(shotId)) return;
    const history = current.generationHistory.find(item => item.id === current.activeHistoryId);
    const shot = history?.shots.find(item => item.id === shotId && (item.status === "error" || (regenerate && item.status === "done")));
    if (!history || !shot) return;
    const inputs = shot.metadata.inputImages;
    const product = inputs?.find(image => image.kind === "product")?.imageUrl;
    const reference = inputs?.find(image => image.kind === "reference")?.imageUrl;
    const quality = shot.metadata.generationSettings?.quality ?? QUALITY_OPTIONS.find(option => option.id === shot.metadata.quality || option.label === shot.metadata.quality)?.id ?? "medium";
    const updateShot = (patch: Partial<LibraryGenerationShot>, message: string) => set(state => {
      const generationHistory = state.generationHistory.map(item => item.id === history.id ? { ...item, shots: item.shots.map(image => image.id === shotId ? { ...image, ...patch } : image) } : item);
      return { generationHistory, ...(state.activeHistoryId === history.id && state.workspaceProjectId === current.workspaceProjectId ? {
        generationShots: generationHistory.find(item => item.id === history.id)?.shots ?? [], generationMessage: message,
      } : {}) };
    });
    if (!product || !shot.metadata.finalPrompt) {
      updateShot({ error: "다시 생성에 필요한 원본 이미지 또는 프롬프트가 저장되어 있지 않습니다." }, "다시 생성에 필요한 원본 정보를 찾지 못했습니다.");
      return;
    }
    queuedRetries.add(shotId);
    set({ isGenerating: true });
    updateShot({ status: "pending", error: undefined }, `${shot.label} 다시 생성 대기 중…`);
    await scheduleGeneration(async () => {
    updateShot({ status: "generating", error: undefined }, `${shot.label} 다시 생성 중…`);
    try {
      const [productImage, referenceImage] = await Promise.all([optimizeImageDataUrl(product), reference ? optimizeImageDataUrl(reference) : Promise.resolve(null)]);
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        productImage, referenceImages: referenceImage ? [referenceImage] : [], prompt: shot.metadata.finalPrompt, quality, ratio: shot.ratio, mockMode,
      }) });
      const result = await response.json().catch(() => ({ error: `서버가 올바르지 않은 응답을 반환했습니다. (${response.status})` })) as GenerationApiResponse | GenerationApiError;
      if (!response.ok || !("images" in result) || !result.images[0]) {
        if (response.status === 401 && "code" in result && result.code === "AUTH_REQUIRED") window.location.assign("/login");
        throw new Error("error" in result ? result.error : "이미지를 다시 생성하지 못했습니다.");
      }
      if (!result.mock && result.tokenUsage) useTokenUsageStore.getState().recordUsage(result.tokenUsage, cutGenerationUsageContext({
        model: result.metadata?.model ?? "unknown-image-model", contentSet: shot.metadata.generationSettings?.contentSet ?? null,
        shotId, shotLabel: shot.label, ratio: shot.ratio, quality, hasReference: Boolean(referenceImage),
      }));
      updateShot({ status: "done", imageUrl: result.images[0], fidelity: result.fidelityEvaluations?.[0], error: undefined, metadata: { ...shot.metadata, generatedAt: new Date().toISOString() } }, "다시 생성이 완료되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "이미지를 다시 생성하지 못했습니다.";
      updateShot({ status: shot.imageUrl ? "done" : "error", error: message }, message);
    } finally {
      queuedRetries.delete(shotId);
      set({ isGenerating: batchRunning || queuedRetries.size > 0 });
      await saveGenerationHistory(get().generationHistory);
    }
    });
  },
  requestGeneration: async (mockMode) => {
    const current = get();
    if (current.isGenerating) return { usedActualGeneration: false, actualCompleted: 0, completed: 0, failed: 0 };
    const runProjectId = current.workspaceProjectId;
    const lastGenerationPrompts = buildGenerationPrompts(current);
    const runCreatedAt = new Date().toISOString();
    const runId = `generation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const editModeLabel = EDIT_MODE_OPTIONS.find(
      (option) => option.id === current.editMode,
    )?.label ?? "기본";
    const qualityLabel = QUALITY_OPTIONS.find(
      (option) => option.id === current.quality,
    )?.label ?? current.quality;
    const variationType = getBatchLabel(current.batchEntries);
    const shotDrafts = createGenerationShots(current);

    if (
      shotDrafts.length === 0
      || !current.productImage
      || lastGenerationPrompts.length === 0
    ) {
      return {
        usedActualGeneration: false,
        actualCompleted: 0,
        completed: 0,
        failed: 0,
      };
    }

    const productImage = current.productImage;
    batchRunning = true;
    set({ isGenerating: true });
    let requestProductImage: string;
    let requestReferenceImage: string | null;
    try {
      [requestProductImage, requestReferenceImage] = await Promise.all([
        optimizeImageDataUrl(productImage),
        current.referenceImage ? optimizeImageDataUrl(current.referenceImage) : Promise.resolve(null),
      ]);
    } catch (error) {
      batchRunning = false;
      set({ isGenerating: queuedRetries.size > 0, generationMessage: error instanceof Error ? error.message : "입력 이미지를 처리하지 못했습니다." });
      return { usedActualGeneration: false, actualCompleted: 0, completed: 0, failed: shotDrafts.length };
    }
    const generationShots: LibraryGenerationShot[] = shotDrafts
      .map((shot) => {
        const shotPrompt = lastGenerationPrompts.find((item) => item.id === shot.id)
          ?? lastGenerationPrompts[0];
        return {
          ...shot,
          id: `${runId}-${shot.id}`,
          bookmarked: false,
          metadata: {
            finalPrompt: shotPrompt?.prompt ?? "",
            generatedAt: runCreatedAt,
            aiModel: "gpt-image-2",
            variationType: `${variationType} · ${shot.label}`,
            quality: qualityLabel,
            editMode: current.referenceImage ? editModeLabel : "기본",
            light: current.light,
            mood: current.mood,
            props: current.props,
            additionalDirection: current.prompt.trim() || "없음",
            imageSize: shot.resolution,
            inputImages: [
              {
                kind: "product",
                label: "내 제품 이미지",
                imageUrl: productImage,
              },
              ...(current.referenceImage ? [{
                kind: "reference" as const,
                label: "레퍼런스 이미지",
                imageUrl: current.referenceImage,
              }] : []),
            ],
            generationSettings: {
              brandSelection: current.brandSelection ? { ...current.brandSelection } : null,
              batchEntries: cloneBatch(current.batchEntries),
              contentSet: current.contentSet,
              angleVariationIds: [...current.angleVariationIds],
              freeCount: current.freeCount,
              quality: current.quality,
              ...(current.referenceImage ? { editMode: current.editMode } : {}),
              light: current.light,
              mood: current.mood,
              props: [...current.props],
              prompt: current.prompt,
            },
          },
        };
      });

    set({
      isGenerating: true,
      generationRequested: true,
      lastGenerationPrompts,
      generationShots,
      activeHistoryId: runId,
      selectedShotId: null, selectedShotIds: [], selectionAnchorId: null,
      generationHistory: [
        {
          id: runId,
          projectId: runProjectId,
          createdAt: runCreatedAt,
          title: current.generationHistory.find(history => history.id === current.activeHistoryId)?.title ?? current.draftTitle,
          shots: generationShots,
        },
        ...current.generationHistory,
      ],
      generationMessage: "생성 작업을 준비하고 있습니다.",
    });

    if (runProjectId) {
      useProjectStore.getState().recordGenerationSet(
        runProjectId,
        runId,
        runCreatedAt,
      );
    }

    let usedActualGeneration = false;
    let actualCompleted = 0;
    let completed = 0;
    let failed = 0;

    await saveGenerationHistory(get().generationHistory);

    const concurrency = FREE_GENERATION_CONCURRENCY;

    await runGenerationQueue(generationShots, concurrency, async (shot) => {
      const prompt = { prompt: shot.metadata.finalPrompt };

      set((state) => {
        const runHistory = state.generationHistory.find(
          history => history.id === runId,
        );
        const nextShots = (runHistory?.shots ?? generationShots).map((item) => ({
          ...item,
          status: item.id === shot.id ? "generating" : item.status,
          error: item.id === shot.id ? undefined : item.error,
        })) as LibraryGenerationShot[];
        const generationHistory = state.generationHistory.map(history => (
          history.id === runId ? { ...history, shots: nextShots } : history
        ));
        const generatingCount = nextShots.filter(
          (item) => item.status === "generating",
        ).length;
        const showingRun = state.workspaceProjectId === runProjectId
          && state.activeHistoryId === runId;

        return {
          generationHistory,
          ...(showingRun ? {
            generationShots: nextShots,
            generationMessage: generatingCount > 1
              ? `${generatingCount}개 이미지를 동시에 생성하고 있습니다.`
              : `${shot.label} 이미지를 생성하고 있습니다.`,
          } : {}),
        };
      });

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productImage: requestProductImage,
            referenceImages: requestReferenceImage
              ? [requestReferenceImage]
              : [],
            prompt: prompt.prompt,
            quality: current.quality,
            ratio: shot.ratio,
            mockMode,
          }),
        });
        const result = await response.json().catch(() => ({
          error: response.status === 500
            ? "Netlify Function이 요청을 처리하지 못했습니다. 이미지 용량 또는 실행 시간 제한을 확인해 주세요."
            : `서버가 올바르지 않은 응답을 반환했습니다. (${response.status})`,
        })) as GenerationApiResponse | GenerationApiError;

        if (!response.ok || !("images" in result) || !result.images[0]) {
          if (response.status === 401 && "code" in result && result.code === "AUTH_REQUIRED") {
            window.location.assign("/login");
          }
          const message = "error" in result
            ? result.error
            : "이미지를 생성하지 못했습니다.";
          throw new Error(message);
        }

        if (result.mock) {
          await new Promise((resolve) => window.setTimeout(resolve, 450));
        } else {
          usedActualGeneration = true;
          actualCompleted += 1;
          if (result.tokenUsage) {
            useTokenUsageStore.getState().recordUsage(
              result.tokenUsage,
              cutGenerationUsageContext({
                model: result.metadata?.model ?? "unknown-image-model",
                contentSet: current.contentSet,
                shotId: shot.id,
                shotLabel: shot.label,
                ratio: shot.ratio,
                quality: current.quality,
                hasReference: Boolean(requestReferenceImage),
              }),
            );
          }
        }
        completed += 1;

        set((state) => {
          const runHistory = state.generationHistory.find(
            history => history.id === runId,
          );
          const runShots = (runHistory?.shots ?? generationShots).map(
            (item) => item.id === shot.id
            ? {
                ...item,
                status: "done",
                imageUrl: result.images[0],
                fidelity: result.fidelityEvaluations?.[0],
              }
            : item,
          ) as LibraryGenerationShot[];
          const generationHistory = state.generationHistory.map((history) => history.id === runId
            ? { ...history, shots: runShots }
            : history);
          const showingRun = state.workspaceProjectId === runProjectId
            && state.activeHistoryId === runId;
          return {
            generationHistory,
            ...(showingRun ? {
              generationShots: runShots,
              selectedShotId: state.selectedShotId,
    selectedShotIds: [...state.selectedShotIds],
    selectionAnchorId: state.selectionAnchorId,
              generationMessage: result.note,
            } : {}),
          };
        });
      } catch (error) {
        failed += 1;
        const message = error instanceof Error
          ? error.message
          : "이미지를 생성하지 못했습니다.";

        set((state) => {
          const runHistory = state.generationHistory.find(
            history => history.id === runId,
          );
          const runShots = (runHistory?.shots ?? generationShots).map(
            (item) => item.id === shot.id
            ? {
                ...item,
                status: "error",
                error: message,
              }
            : item,
          ) as LibraryGenerationShot[];
          const generationHistory = state.generationHistory.map((history) => history.id === runId
            ? { ...history, shots: runShots }
            : history);
          const showingRun = state.workspaceProjectId === runProjectId
            && state.activeHistoryId === runId;
          return {
            generationHistory,
            ...(showingRun ? {
              generationShots: runShots,
              generationMessage: message,
            } : {}),
          };
        });
      }
    });

    batchRunning = false;
    set(state => ({
      isGenerating: queuedRetries.size > 0,
      ...(state.workspaceProjectId === runProjectId
        && state.activeHistoryId === runId ? {
          generationMessage: failed > 0
            ? `${completed}개 완료, ${failed}개 실패했습니다.`
            : `${completed}개 이미지 생성을 완료했습니다.`,
        } : {}),
    }));

    await saveGenerationHistory(get().generationHistory);

    return {
      usedActualGeneration,
      actualCompleted,
      completed,
      failed,
    };
  },
}));
