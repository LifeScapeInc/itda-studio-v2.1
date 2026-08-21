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
import {
  FREE_GENERATION_CONCURRENCY,
  runGenerationQueue,
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
import { getGenerationModeLabel } from "@/system/create/generation-prompt";

export type GenerationRunResult = {
  usedActualGeneration: boolean;
  actualCompleted: number;
  completed: number;
  failed: number;
};

type CreateWorkspaceSnapshot = {
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
  generationRequested: boolean;
  generationMessage: string;
  lastGenerationPrompts: GenerationPrompt[];
  generationShots: GenerationShot[];
  activeHistoryId: string | null;
  selectedShotId: string | null;
};

type CreateStore = {
  workspaceProjectId: string | null;
  workspaceSnapshots: Record<string, CreateWorkspaceSnapshot>;
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
  setProjectContext: (projectId: string | null) => void;
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
  clearStaging: () => void;
  reuseGenerationSettings: (shot: LibraryGenerationShot) => void;
  restoreHistory: (historyId: string) => void;
  deleteHistory: (historyId: string) => void;
  toggleBookmark: (shotId: string) => void;
  requestGeneration: (mockMode: boolean) => Promise<GenerationRunResult>;
};

const UNSCOPED_WORKSPACE_KEY = "__unscoped__";

function getWorkspaceKey(projectId: string | null): string {
  return projectId ?? UNSCOPED_WORKSPACE_KEY;
}

function createEmptyWorkspace(): CreateWorkspaceSnapshot {
  return {
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
    generationRequested: false,
    generationMessage: "",
    lastGenerationPrompts: [],
    generationShots: [],
    activeHistoryId: null,
    selectedShotId: null,
  };
}

function captureWorkspace(state: CreateStore): CreateWorkspaceSnapshot {
  return {
    productImage: state.productImage,
    referenceImage: state.referenceImage,
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
    activeHistoryId: activeHistory.id,
    selectedShotId: activeHistory.shots.find(
      shot => shot.id === workspace.selectedShotId && shot.status === "done",
    )?.id ?? activeHistory.shots.find(shot => shot.status === "done")?.id ?? null,
    generationMessage: `${new Date(activeHistory.createdAt).toLocaleString("ko-KR")} 생성 결과`,
  };
}

export const useCreateStore = create<CreateStore>((set, get) => ({
  workspaceProjectId: null,
  workspaceSnapshots: {},
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
  selectShot: (selectedShotId) => set({ selectedShotId }),
  clearStaging: () => {
    if (get().isGenerating) return;
    set({
      activeHistoryId: null,
      generationRequested: false,
      generationShots: [],
      selectedShotId: null,
      generationMessage: "",
    });
  },
  reuseGenerationSettings: (shot) => {
    if (get().isGenerating) return;

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

    set((state) => ({
      productImage: productImage ?? state.productImage,
      referenceImage,
      contentSet: snapshot?.contentSet ?? fallbackContentSet,
      angleVariationIds: snapshot?.angleVariationIds
        ?? (fallbackAngle ? [fallbackAngle] : []),
      freeCount: snapshot?.freeCount ?? 1,
      quality: snapshot?.quality ?? fallbackQuality,
      ...(referenceImage && (snapshot?.editMode || fallbackEditMode) ? {
        editMode: snapshot?.editMode ?? fallbackEditMode,
      } : {}),
      light: snapshot?.light ?? metadata.light,
      mood: snapshot?.mood ?? metadata.mood,
      props: [...(snapshot?.props ?? metadata.props)],
      prompt: snapshot?.prompt
        ?? (metadata.additionalDirection === "없음"
          ? ""
          : metadata.additionalDirection),
      activeHistoryId: null,
      generationRequested: false,
      generationShots: [],
      selectedShotId: null,
      generationMessage: "",
    }));
  },
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
    const variationType = getGenerationModeLabel(
      current.contentSet,
      current.angleVariationIds,
    );
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
    const [requestProductImage, requestReferenceImage] = await Promise.all([
      optimizeImageDataUrl(productImage),
      current.referenceImage
        ? optimizeImageDataUrl(current.referenceImage)
        : Promise.resolve(null),
    ]);
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
      selectedShotId: null,
      generationHistory: [
        {
          id: runId,
          projectId: runProjectId,
          createdAt: runCreatedAt,
          title: variationType,
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

    const concurrency = current.contentSet === "free"
      ? FREE_GENERATION_CONCURRENCY
      : generationShots.length;

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
            useTokenUsageStore.getState().recordUsage(result.tokenUsage);
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
              selectedShotId: state.selectedShotId ?? shot.id,
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

    set(state => ({
      isGenerating: false,
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
