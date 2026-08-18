"use client";

import { create } from "zustand";
import {
  createDetailTilesFromStructure,
  DETAIL_TILE_DEFINITIONS,
  type DetailPageStep,
  type DetailTile,
  type DetailTileType,
  type PlanningCandidate,
  type ProcessedPlanningInput,
  type PlanningReference,
  type RequestDocument,
} from "@/system/detail-page/detail-page-types";
import { generatePlanning } from "@/system/detail-page/planning-api";
import { generateTemplateStructure } from "@/system/detail-page/template-structure-api";
import { generateDetailPage } from "@/system/detail-page/page-generation-api";
import type { GeneratedDetailPage } from "@/system/detail-page/page-generation-types";
import { useProjectStore } from "@/stores/useProjectStore";

type DetailWorkspaceSnapshot = {
  step: DetailPageStep;
  furnitureImage: string | null;
  requestDocument: RequestDocument | null;
  isPlanning: boolean;
  planningIsMock: boolean;
  planningProgressStage: "input" | "proposal" | null;
  planningStartedAt: number | null;
  isTemplatePlanning: boolean;
  templatePlanningStartedAt: number | null;
  templatePlanningDurationSeconds: number | null;
  templatePlanningError: string;
  isPageGenerating: boolean;
  pageGenerationStartedAt: number | null;
  pageGenerationDurationSeconds: number | null;
  pageGenerationError: string;
  generatedPage: GeneratedDetailPage | null;
  planningError: string;
  planningNote: string;
  planningInput: ProcessedPlanningInput | null;
  planningMetadata: { model?: string };
  sourceSummary: string;
  plans: PlanningCandidate[];
  references: PlanningReference[];
  planIndex: number;
  selectedPlanId: string | null;
  tiles: DetailTile[];
  selectedTileId: string | null;
};

type DetailPageStore = DetailWorkspaceSnapshot & {
  workspaceProjectId: string | null;
  workspaceSnapshots: Record<string, DetailWorkspaceSnapshot>;
  setProjectContext: (projectId: string | null) => void;
  setFurnitureImage: (image: string | null) => void;
  setRequestDocument: (document: RequestDocument | null) => void;
  clearMockPlanning: () => void;
  generatePlanning: (mockMode: boolean) => Promise<void>;
  showPreviousPlan: () => void;
  showNextPlan: () => void;
  showPlan: (planIndex: number) => void;
  confirmPlan: (mockMode: boolean) => Promise<void>;
  startEditing: (mockMode: boolean) => Promise<void>;
  goToStep: (step: DetailPageStep) => void;
  selectTile: (tileId: string | null) => void;
  addTile: (type: DetailTileType, index?: number) => void;
  removeTile: (tileId: string) => void;
  moveTile: (tileId: string, targetIndex: number) => void;
  reorderTiles: (tiles: DetailTile[]) => void;
  updateTile: (
    tileId: string,
    changes: Partial<Pick<DetailTile, "description" | "imageLayout" | "shotCount">>,
  ) => void;
};

const UNSCOPED_KEY = "__unscoped_detail_page__";

function getWorkspaceKey(projectId: string | null): string {
  return projectId ?? UNSCOPED_KEY;
}

function createEmptyWorkspace(): DetailWorkspaceSnapshot {
  return {
    step: "planning",
    furnitureImage: null,
    requestDocument: null,
    isPlanning: false,
    planningIsMock: false,
    planningProgressStage: null,
    planningStartedAt: null,
    isTemplatePlanning: false,
    templatePlanningStartedAt: null,
    templatePlanningDurationSeconds: null,
    templatePlanningError: "",
    isPageGenerating: false,
    pageGenerationStartedAt: null,
    pageGenerationDurationSeconds: null,
    pageGenerationError: "",
    generatedPage: null,
    planningError: "",
    planningNote: "",
    planningInput: null,
    planningMetadata: {},
    sourceSummary: "",
    plans: [],
    references: [],
    planIndex: 0,
    selectedPlanId: null,
    tiles: [],
    selectedTileId: null,
  };
}

function captureWorkspace(state: DetailPageStore): DetailWorkspaceSnapshot {
  return {
    step: state.step,
    furnitureImage: state.furnitureImage,
    requestDocument: state.requestDocument,
    isPlanning: state.isPlanning,
    planningIsMock: state.planningIsMock,
    planningProgressStage: state.planningProgressStage,
    planningStartedAt: state.planningStartedAt,
    isTemplatePlanning: state.isTemplatePlanning,
    templatePlanningStartedAt: state.templatePlanningStartedAt,
    templatePlanningDurationSeconds: state.templatePlanningDurationSeconds,
    templatePlanningError: state.templatePlanningError,
    isPageGenerating: state.isPageGenerating,
    pageGenerationStartedAt: state.pageGenerationStartedAt,
    pageGenerationDurationSeconds: state.pageGenerationDurationSeconds,
    pageGenerationError: state.pageGenerationError,
    generatedPage: state.generatedPage,
    planningError: state.planningError,
    planningNote: state.planningNote,
    planningInput: state.planningInput,
    planningMetadata: state.planningMetadata,
    sourceSummary: state.sourceSummary,
    plans: state.plans,
    references: state.references,
    planIndex: state.planIndex,
    selectedPlanId: state.selectedPlanId,
    tiles: state.tiles,
    selectedTileId: state.selectedTileId,
  };
}

export const useDetailPageStore = create<DetailPageStore>((set, get) => ({
  ...createEmptyWorkspace(),
  workspaceProjectId: null,
  workspaceSnapshots: {},
  setProjectContext: workspaceProjectId => {
    const current = get();
    if (current.workspaceProjectId === workspaceProjectId) return;
    const workspaceSnapshots = {
      ...current.workspaceSnapshots,
      [getWorkspaceKey(current.workspaceProjectId)]: captureWorkspace(current),
    };
    const workspace = workspaceSnapshots[getWorkspaceKey(workspaceProjectId)]
      ?? createEmptyWorkspace();
    set({ ...workspace, workspaceProjectId, workspaceSnapshots });
  },
  setFurnitureImage: furnitureImage => set({ furnitureImage, planningError: "" }),
  setRequestDocument: requestDocument => set({ requestDocument, planningError: "" }),
  clearMockPlanning: () => set(state => state.planningIsMock ? {
    step: "planning",
    isPlanning: false,
    planningIsMock: false,
    planningProgressStage: null,
    planningStartedAt: null,
    isTemplatePlanning: false,
    templatePlanningStartedAt: null,
    templatePlanningDurationSeconds: null,
    templatePlanningError: "",
    isPageGenerating: false,
    pageGenerationStartedAt: null,
    pageGenerationDurationSeconds: null,
    pageGenerationError: "",
    generatedPage: null,
    planningError: "",
    planningNote: "",
    planningInput: null,
    planningMetadata: {},
    sourceSummary: "",
    plans: [],
    references: [],
    planIndex: 0,
    selectedPlanId: null,
    tiles: [],
    selectedTileId: null,
  } : state),
  generatePlanning: async (mockMode) => {
    const current = get();
    const missingRequiredMaterial = !current.furnitureImage
      || !current.requestDocument;
    if (current.isPlanning || (!mockMode && missingRequiredMaterial)) {
      return;
    }
    const runProjectId = current.workspaceProjectId;
    const runKey = getWorkspaceKey(runProjectId);
    const startedAt = Date.now();
    set({
      isPlanning: true,
      planningProgressStage: "input",
      planningStartedAt: startedAt,
      planningError: "",
      planningNote: "",
    });
    try {
      const response = await generatePlanning({
        furnitureImage: current.furnitureImage,
        requestDocument: current.requestDocument,
        mockMode,
        onProgress: planningProgressStage => set(state => (
          state.workspaceProjectId === runProjectId
            ? { planningProgressStage }
            : state
        )),
      });
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isPlanning: false,
          planningIsMock: response.mock,
          planningProgressStage: null,
          planningStartedAt: null,
          isTemplatePlanning: false,
          templatePlanningStartedAt: null,
          templatePlanningDurationSeconds: null,
          templatePlanningError: "",
          isPageGenerating: false,
          pageGenerationStartedAt: null,
          pageGenerationDurationSeconds: null,
          pageGenerationError: "",
          generatedPage: null,
          planningError: "",
          planningNote: `${elapsedSeconds.toFixed(2)}초 소요됨`,
          planningInput: response.input ?? null,
          planningMetadata: response.metadata ?? {},
          sourceSummary: response.sourceSummary,
          plans: response.candidates,
          references: response.references,
          planIndex: 0,
          selectedPlanId: null,
          tiles: [],
          selectedTileId: null,
          step: "planning",
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    } catch (error) {
      const planningError = error instanceof Error
        ? error.message
        : "기획안을 생성하지 못했습니다.";
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isPlanning: false,
          planningProgressStage: null,
          planningStartedAt: null,
          planningError,
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    }
  },
  showPreviousPlan: () => set(state => ({
    planIndex: state.plans.length
      ? (state.planIndex - 1 + state.plans.length) % state.plans.length
      : 0,
  })),
  showNextPlan: () => set(state => ({
    planIndex: state.plans.length
      ? (state.planIndex + 1) % state.plans.length
      : 0,
  })),
  showPlan: planIndex => set(state => ({
    planIndex: state.plans.length
      ? Math.max(0, Math.min(planIndex, state.plans.length - 1))
      : 0,
  })),
  confirmPlan: async (mockMode) => {
    const current = get();
    const selectedPlan = current.plans[current.planIndex];
    if (!selectedPlan || current.isTemplatePlanning) return;
    const runProjectId = current.workspaceProjectId;
    const runKey = getWorkspaceKey(runProjectId);
    const startedAt = Date.now();
    set({
      step: "draft",
      isTemplatePlanning: true,
      templatePlanningStartedAt: startedAt,
      templatePlanningDurationSeconds: null,
      templatePlanningError: "",
      isPageGenerating: false,
      pageGenerationStartedAt: null,
      pageGenerationDurationSeconds: null,
      pageGenerationError: "",
      generatedPage: null,
      selectedPlanId: selectedPlan.id,
      tiles: [],
      selectedTileId: null,
    });
    try {
      const response = await generateTemplateStructure({
        furnitureImage: current.furnitureImage,
        mockMode,
        plan: selectedPlan,
      });
      const tiles = createDetailTilesFromStructure(response.tiles);
      if (!tiles.length) {
        throw new Error("생성된 템플릿 구조가 비어 있습니다.");
      }
      const now = new Date().toISOString();
      if (runProjectId) {
        useProjectStore.getState().recordDetailPageDraft(
          runProjectId,
          `detail-draft-${Date.now()}`,
          now,
        );
      }
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isTemplatePlanning: false,
          templatePlanningStartedAt: null,
          templatePlanningDurationSeconds: (Date.now() - startedAt) / 1000,
          templatePlanningError: "",
          isPageGenerating: false,
          pageGenerationStartedAt: null,
          pageGenerationDurationSeconds: null,
          pageGenerationError: "",
          generatedPage: null,
          selectedPlanId: selectedPlan.id,
          tiles,
          selectedTileId: tiles[0]?.id ?? null,
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    } catch (error) {
      const templatePlanningError = error instanceof Error
        ? error.message
        : "템플릿 구조를 생성하지 못했습니다.";
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isTemplatePlanning: false,
          templatePlanningStartedAt: null,
          templatePlanningDurationSeconds: null,
          templatePlanningError,
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    }
  },
  startEditing: async (mockMode) => {
    const current = get();
    if (!current.tiles.length || current.isPageGenerating) return;
    const runProjectId = current.workspaceProjectId;
    const runKey = getWorkspaceKey(runProjectId);
    const startedAt = Date.now();
    set({
      step: "editor",
      selectedTileId: current.selectedTileId ?? current.tiles[0]?.id ?? null,
      isPageGenerating: true,
      pageGenerationStartedAt: startedAt,
      pageGenerationDurationSeconds: null,
      pageGenerationError: "",
      generatedPage: null,
    });
    try {
      const response = await generateDetailPage({
        furnitureImage: current.furnitureImage,
        planningInput: current.planningInput,
        tiles: current.tiles,
        mockMode,
      });
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isPageGenerating: false,
          pageGenerationStartedAt: null,
          pageGenerationDurationSeconds: (Date.now() - startedAt) / 1000,
          pageGenerationError: "",
          generatedPage: response.page,
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    } catch (error) {
      const pageGenerationError = error instanceof Error
        ? error.message
        : "상세페이지를 생성하지 못했습니다.";
      set(state => {
        const result: Partial<DetailWorkspaceSnapshot> = {
          isPageGenerating: false,
          pageGenerationStartedAt: null,
          pageGenerationDurationSeconds: null,
          pageGenerationError,
          generatedPage: null,
        };
        if (state.workspaceProjectId === runProjectId) return result;
        const saved = state.workspaceSnapshots[runKey] ?? createEmptyWorkspace();
        return {
          workspaceSnapshots: {
            ...state.workspaceSnapshots,
            [runKey]: { ...saved, ...result },
          },
        };
      });
    }
  },
  goToStep: step => set(state => {
    const unlocked = step === "planning"
      || (step === "draft" && Boolean(state.selectedPlanId))
      || (step === "editor" && Boolean(state.selectedPlanId) && state.tiles.length > 0);
    return unlocked ? { step } : state;
  }),
  selectTile: selectedTileId => set({ selectedTileId }),
  addTile: (type, index) => set(state => {
    const definition = DETAIL_TILE_DEFINITIONS.find(item => item.type === type);
    if (!definition) return state;
    const tile: DetailTile = {
      ...definition,
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const nextTiles = [...state.tiles];
    nextTiles.splice(index ?? nextTiles.length, 0, tile);
    return {
      tiles: nextTiles,
      selectedTileId: tile.id,
      generatedPage: null,
      pageGenerationDurationSeconds: null,
      pageGenerationError: "",
    };
  }),
  removeTile: tileId => set(state => {
    const index = state.tiles.findIndex(tile => tile.id === tileId);
    if (index < 0) return state;
    const tiles = state.tiles.filter(tile => tile.id !== tileId);
    return {
      tiles,
      generatedPage: null,
      pageGenerationDurationSeconds: null,
      pageGenerationError: "",
      selectedTileId: state.selectedTileId === tileId
        ? tiles[Math.min(index, tiles.length - 1)]?.id ?? null
        : state.selectedTileId,
    };
  }),
  moveTile: (tileId, targetIndex) => set(state => {
    const sourceIndex = state.tiles.findIndex(tile => tile.id === tileId);
    if (sourceIndex < 0) return state;
    const tiles = [...state.tiles];
    const [tile] = tiles.splice(sourceIndex, 1);
    const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    tiles.splice(Math.max(0, Math.min(adjustedIndex, tiles.length)), 0, tile);
    return {
      tiles,
      generatedPage: null,
      pageGenerationDurationSeconds: null,
      pageGenerationError: "",
    };
  }),
  reorderTiles: tiles => set(state => ({
    tiles,
    generatedPage: null,
    pageGenerationDurationSeconds: null,
    pageGenerationError: "",
    selectedTileId: tiles.some(tile => tile.id === state.selectedTileId)
      ? state.selectedTileId
      : tiles[0]?.id ?? null,
  })),
  updateTile: (tileId, changes) => set(state => ({
    tiles: state.tiles.map(tile => {
      if (tile.id !== tileId) return tile;
      if (tile.kind !== "image" || changes.shotCount === undefined) {
        return { ...tile, ...changes };
      }
      const maximum = tile.type === "hero" ? 1 : 4;
      return {
        ...tile,
        ...changes,
        shotCount: Math.max(1, Math.min(maximum, changes.shotCount)),
      };
    }),
    generatedPage: null,
    pageGenerationDurationSeconds: null,
    pageGenerationError: "",
  })),
}));
