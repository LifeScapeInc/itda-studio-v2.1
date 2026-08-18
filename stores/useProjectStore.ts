"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCaseKey, type IntegrationCase } from "@/system/integrations/cases";
export type ProjectWorkType = "detail_page" | "studio_cut";
export type ProjectStage = "draft" | "final";
export type ProjectWorkRecord = {
  id: string;
  kind: "generated_image" | "detail_page";
  createdAt: string;
  assetUrl?: string;
};
export type StudioProject = {
  id: string;
  projectName: string;
  workType: ProjectWorkType;
  stage: ProjectStage;
  manager: string;
  company: string;
  email: string;
  deliveryDueDate: string | null;
  sourceCase: IntegrationCase | null;
  sourceCaseKey: string | null;
  previewImages: string[];
  workHistory: ProjectWorkRecord[];
  createdAt: string;
  updatedAt: string;
};
export type ManualProjectInput = {
  projectName: string;
  workType: ProjectWorkType;
  stage: ProjectStage;
  manager?: string;
  company?: string;
  email?: string;
  deliveryDueDate?: string | null;
};
type ProjectStore = {
  projects: StudioProject[];
  activeProjectId: string | null;
  openProjectIds: string[];
  hydrated: boolean;
  createProjectFromCase: (item: IntegrationCase) => StudioProject;
  createManualProject: (input: ManualProjectInput) => StudioProject;
  openProject: (projectId: string) => void;
  openUnscopedWorkspace: () => void;
  closeProjectTab: (projectId: string) => void;
  recordGenerationSet: (projectId: string, historyId: string, createdAt: string) => void;
  recordDetailPageDraft: (projectId: string, workId: string, createdAt: string) => void;
  markHydrated: () => void;
  deleteProject: (projectId: string) => void;
};
const FINAL_STATUSES = new Set(["completed", "delivered", "done", "final"]);
const seedCase: IntegrationCase = {
  email: "jusmint3@daum.net",
  name: "이도운",
  case_name: "라이프스케이프_너드커넥션_0805",
  delivery_due_date: null,
  status: "draft",
  service_label: "스튜디오 연출 컷",
  project_exists: true,
  project_id: "project-lifescape-nerdconnection-0805"
};
const seedProject: StudioProject = {
  id: "project-lifescape-nerdconnection-0805",
  projectName: "라이프스케이프_너드커넥션_0805",
  workType: "studio_cut",
  stage: "draft",
  manager: "이도운",
  company: "라이프스케이프",
  email: "jusmint3@daum.net",
  deliveryDueDate: null,
  sourceCase: seedCase,
  sourceCaseKey: getCaseKey(seedCase),
  previewImages: [],
  workHistory: [],
  createdAt: "2026-08-07T00:00:00+09:00",
  updatedAt: "2026-08-07T00:00:00+09:00"
};
function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `project-${Date.now()}`;
}
function inferWorkType(serviceLabel: string | null): ProjectWorkType {
  return serviceLabel?.includes("상세") ? "detail_page" : "studio_cut";
}
function inferStage(status: string | null): ProjectStage {
  const normalized = status?.trim().toLowerCase() ?? "";
  return FINAL_STATUSES.has(normalized) ? "final" : "draft";
}
function sameCase(project: StudioProject, item: IntegrationCase): boolean {
  if (!project.sourceCase) {
    return false;
  }
  const exactKey = getCaseKey(item);
  if (project.sourceCaseKey === exactKey) {
    return true;
  }
  const projectEmail = project.sourceCase.email?.trim().toLowerCase() ?? "";
  const itemEmail = item.email?.trim().toLowerCase() ?? "";
  const projectCaseName = project.sourceCase.case_name?.trim().toLowerCase() ?? "";
  const itemCaseName = item.case_name?.trim().toLowerCase() ?? "";
  return Boolean(projectEmail && projectCaseName && projectEmail === itemEmail && projectCaseName === itemCaseName);
}
export function projectExistsForCase(projects: StudioProject[], item: IntegrationCase): boolean {
  return projects.some(project => sameCase(project, item));
}
export function getProjectWorkTypeLabel(workType: ProjectWorkType): string {
  return workType === "detail_page" ? "상세 페이지" : "스튜디오 연출 컷";
}
export const useProjectStore = create<ProjectStore>()(persist((set, get) => ({
  projects: [seedProject],
  activeProjectId: null,
  openProjectIds: [],
  hydrated: false,
  createProjectFromCase: item => {
    const existing = get().projects.find(project => sameCase(project, item));
    if (existing) {
      set({
        activeProjectId: null,
      });
      return existing;
    }
    const now = new Date().toISOString();
    const project: StudioProject = {
      id: createId(),
      projectName: item.case_name?.trim() || "이름 없는 프로젝트",
      workType: inferWorkType(item.service_label),
      stage: inferStage(item.status),
      manager: item.name?.trim() || "",
      company: "",
      email: item.email?.trim() || "",
      deliveryDueDate: item.delivery_due_date?.trim() || null,
      sourceCase: {
        ...item
      },
      sourceCaseKey: getCaseKey(item),
      previewImages: [],
      workHistory: [],
      createdAt: now,
      updatedAt: now
    };
    set(state => ({
      projects: [project, ...state.projects],
      activeProjectId: null,
    }));
    return project;
  },
  createManualProject: input => {
    const now = new Date().toISOString();
    const project: StudioProject = {
      id: createId(),
      projectName: input.projectName.trim(),
      workType: input.workType,
      stage: input.stage,
      manager: input.manager?.trim() || "",
      company: input.company?.trim() || "",
      email: input.email?.trim() || "",
      deliveryDueDate: input.deliveryDueDate || null,
      sourceCase: null,
      sourceCaseKey: null,
      previewImages: [],
      workHistory: [],
      createdAt: now,
      updatedAt: now
    };
    set(state => ({
      projects: [project, ...state.projects],
      activeProjectId: null,
    }));
    return project;
  },
  openProject: projectId => set(state => {
    if (!state.projects.some(project => project.id === projectId)) {
      return state;
    }
    return {
      activeProjectId: projectId,
      openProjectIds: state.openProjectIds.includes(projectId)
        ? state.openProjectIds
        : [...state.openProjectIds, projectId],
    };
  }),
  openUnscopedWorkspace: () => set({ activeProjectId: null }),
  closeProjectTab: projectId => set(state => ({
    openProjectIds: state.openProjectIds.filter(id => id !== projectId),
    activeProjectId: state.activeProjectId === projectId
      ? null
      : state.activeProjectId,
  })),
  recordGenerationSet: (projectId, historyId, createdAt) => set(state => ({
    projects: state.projects.map(project => {
      if (project.id !== projectId) return project;
      if (project.workHistory.some(record => record.id === historyId)) {
        return project;
      }
      return {
        ...project,
        workHistory: [
          {
            id: historyId,
            kind: "generated_image" as const,
            createdAt,
          },
          ...project.workHistory,
        ],
        updatedAt: createdAt,
      };
    }),
  })),
  recordDetailPageDraft: (projectId, workId, createdAt) => set(state => ({
    projects: state.projects.map(project => {
      if (project.id !== projectId) return project;
      if (project.workHistory.some(record => record.id === workId)) return project;
      return {
        ...project,
        workHistory: [
          { id: workId, kind: "detail_page" as const, createdAt },
          ...project.workHistory,
        ],
        updatedAt: createdAt,
      };
    }),
  })),
  markHydrated: () => set({ hydrated: true }),
  deleteProject: projectId => set(state => ({
    projects: state.projects.filter(project => project.id !== projectId),
    openProjectIds: state.openProjectIds.filter(id => id !== projectId),
    activeProjectId: state.activeProjectId === projectId
      ? null
      : state.activeProjectId
  }))
}), {
  name: "itda-studio-v2.1-projects",
  version: 2,
  skipHydration: true,
  partialize: state => ({
    projects: state.projects,
    openProjectIds: state.openProjectIds,
  }),
  migrate: persistedState => {
    const state = persistedState as Partial<ProjectStore>;
    return {
      ...state,
      activeProjectId: null,
      openProjectIds: Array.isArray(state.openProjectIds)
        ? state.openProjectIds
        : [],
      hydrated: false,
    } as ProjectStore;
  },
}));
