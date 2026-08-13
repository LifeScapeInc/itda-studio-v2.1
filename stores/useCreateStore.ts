"use client";

import { create } from "zustand";
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
import type {
  GenerationApiError,
  GenerationApiResponse,
} from "@/system/create/generation-api";
import {
  loadGenerationHistory,
  saveGenerationHistory,
  type GenerationHistorySet,
  type LibraryGenerationShot,
} from "@/system/create/generation-library";
import {
  EDIT_MODE_OPTIONS,
  QUALITY_OPTIONS,
} from "@/system/create/generation-options";
import { getGenerationModeLabel } from "@/system/create/generation-prompt";

export type GenerationRunResult = {
  usedActualGeneration: boolean;
  actualCompleted: number;
  completed: number;
  failed: number;
};

type CreateStore = {
  productImage: string | null;
  referenceImage: string | null;
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
  libraryHydrated: boolean;
  setProductImage: (image: string | null) => void;
  setReferenceImage: (image: string | null) => void;
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
  selectShot: (shotId: string) => void;
  restoreHistory: (historyId: string) => void;
  deleteHistory: (historyId: string) => void;
  toggleBookmark: (shotId: string) => void;
  requestGeneration: (mockMode: boolean) => Promise<GenerationRunResult>;
};

export const useCreateStore = create<CreateStore>((set, get) => ({
  productImage: null,
  referenceImage: null,
  contentSet: null,
  angleVariationIds: [],
  freeCount: 1,
  quality: "medium",
  editMode: "swap",
  light: "아침 햇살",
  mood: "모던 미니멀",
  props: [],
  prompt: "",
  isGenerating: false,
  generationRequested: false,
  generationMessage: "",
  lastGenerationPrompts: [],
  generationShots: [],
  generationHistory: [],
  activeHistoryId: null,
  selectedShotId: null,
  libraryHydrated: false,
  setProductImage: (productImage) => {
    set({ productImage, generationRequested: false });
  },
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
      props: state.props.includes(prop)
        ? state.props.filter((item) => item !== prop)
        : [...state.props, prop],
    }));
  },
  setPrompt: (prompt) => {
    set({ prompt });
  },
  hydrateLibrary: async () => {
    if (get().libraryHydrated) return;
    try {
      const generationHistory = await loadGenerationHistory();
      set({ generationHistory, libraryHydrated: true });
    } catch {
      set({ libraryHydrated: true });
    }
  },
  selectShot: (selectedShotId) => set({ selectedShotId }),
  restoreHistory: (historyId) => {
    const history = get().generationHistory.find((item) => item.id === historyId);
    if (!history) return;
    set({
      activeHistoryId: history.id,
      generationRequested: true,
      generationShots: history.shots,
      selectedShotId: history.shots.find((shot) => shot.status === "done")?.id ?? null,
      generationMessage: `${new Date(history.createdAt).toLocaleString("ko-KR")} 생성 결과`,
    });
  },
  deleteHistory: (historyId) => {
    const current = get();
    if (current.isGenerating && current.activeHistoryId === historyId) return;

    const generationHistory = current.generationHistory.filter(
      (history) => history.id !== historyId,
    );
    const deletedActiveHistory = current.activeHistoryId === historyId;
    const nextActiveHistory = deletedActiveHistory
      ? generationHistory[0]
      : generationHistory.find(
          (history) => history.id === current.activeHistoryId,
        );

    set({
      generationHistory,
      ...(deletedActiveHistory ? {
        activeHistoryId: nextActiveHistory?.id ?? null,
        generationRequested: Boolean(nextActiveHistory),
        generationShots: nextActiveHistory?.shots ?? [],
        selectedShotId: nextActiveHistory?.shots.find(
          (shot) => shot.status === "done",
        )?.id ?? null,
        generationMessage: nextActiveHistory
          ? `${new Date(nextActiveHistory.createdAt).toLocaleString("ko-KR")} 생성 결과`
          : "",
      } : {}),
    });
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
  requestGeneration: async (mockMode) => {
    const current = get();
    const lastGenerationPrompts = buildGenerationPrompts(current);
    const runCreatedAt = new Date().toISOString();
    const runId = `generation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const editModeLabel = EDIT_MODE_OPTIONS.find(
      (option) => option.id === current.editMode,
    )?.label ?? "기본";
    const qualityLabel = QUALITY_OPTIONS.find(
      (option) => option.id === current.quality,
    )?.label ?? current.quality;
    const variationType = getGenerationModeLabel(
      current.contentSet,
      current.angleVariationIds,
    );
    const generationShots: LibraryGenerationShot[] = createGenerationShots(current)
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
          },
        };
      });

    if (
      generationShots.length === 0
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

    set({
      isGenerating: true,
      generationRequested: true,
      lastGenerationPrompts,
      generationShots,
      activeHistoryId: runId,
      selectedShotId: null,
      generationHistory: [
        {
          id: runId,
          createdAt: runCreatedAt,
          title: variationType,
          shots: generationShots,
        },
        ...current.generationHistory,
      ],
      generationMessage: "생성 작업을 준비하고 있습니다.",
    });

    let usedActualGeneration = false;
    let actualCompleted = 0;
    let completed = 0;
    let failed = 0;

    void saveGenerationHistory(get().generationHistory);

    for (const shot of generationShots) {
      const prompt = { prompt: shot.metadata.finalPrompt };

      set((state) => ({
        generationShots: state.generationShots.map((item) => ({
          ...item,
          status: item.id === shot.id ? "generating" : item.status,
          error: item.id === shot.id ? undefined : item.error,
        })),
        generationMessage: `${shot.label} 이미지를 생성하고 있습니다.`,
      }));

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productImage: current.productImage,
            referenceImages: current.referenceImage
              ? [current.referenceImage]
              : [],
            prompt: prompt.prompt,
            quality: current.quality,
            ratio: shot.ratio,
            mockMode,
          }),
        });
        const result = await response.json() as GenerationApiResponse | GenerationApiError;

        if (!response.ok || !("images" in result) || !result.images[0]) {
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
        }
        completed += 1;

        set((state) => {
          const generationShots = state.generationShots.map((item) => item.id === shot.id
            ? {
                ...item,
                status: "done",
                imageUrl: result.images[0],
              }
            : item) as LibraryGenerationShot[];
          const generationHistory = state.generationHistory.map((history) => history.id === runId
            ? { ...history, shots: generationShots }
            : history);
          void saveGenerationHistory(generationHistory);
          return {
            generationShots,
            generationHistory,
            selectedShotId: state.selectedShotId ?? shot.id,
            generationMessage: result.note,
          };
        });
      } catch (error) {
        failed += 1;
        const message = error instanceof Error
          ? error.message
          : "이미지를 생성하지 못했습니다.";

        set((state) => {
          const generationShots = state.generationShots.map((item) => item.id === shot.id
            ? {
                ...item,
                status: "error",
                error: message,
              }
            : item) as LibraryGenerationShot[];
          const generationHistory = state.generationHistory.map((history) => history.id === runId
            ? { ...history, shots: generationShots }
            : history);
          void saveGenerationHistory(generationHistory);
          return { generationShots, generationHistory, generationMessage: message };
        });
      }
    }

    set({
      isGenerating: false,
      generationMessage: failed > 0
        ? `${completed}개 완료, ${failed}개 실패했습니다.`
        : `${completed}개 이미지 생성을 완료했습니다.`,
    });

    return {
      usedActualGeneration,
      actualCompleted,
      completed,
      failed,
    };
  },
}));
