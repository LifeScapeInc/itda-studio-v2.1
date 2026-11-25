"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cloudRequest } from "@/system/cloud/client";
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
    loading: boolean;
    loadError: string | null;
    createProjectFromCase: (item: IntegrationCase) => Promise<StudioProject>;
    createManualProject: (input: ManualProjectInput) => Promise<StudioProject>;
    openProject: (projectId: string) => void;
    openUnscopedWorkspace: () => void;
    closeProjectTab: (projectId: string) => void;
    recordGenerationSet: (projectId: string, historyId: string, createdAt: string) => void;
    recordDetailPageDraft: (projectId: string, workId: string, createdAt: string) => void;
    markHydrated: () => void;
    deleteProject: (projectId: string) => Promise<void>;
    duplicateProject: (projectId: string) => Promise<StudioProject>;
    hydrate: () => Promise<void>;
};
const FINAL_STATUSES = new Set(["completed", "delivered", "done", "final"]);
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
let projectLoad: Promise<void> | null = null;
export const useProjectStore = create<ProjectStore>()(persist((set, get) => ({
    projects: [], activeProjectId: null, openProjectIds: [], hydrated: false, loading: false, loadError: null,
    hydrate: () => {
        if (projectLoad)
            return projectLoad;
        set({loading:true,loadError:null});
        projectLoad = cloudRequest<StudioProject[]>("projects").then(projects => {
            set(state => ({ projects, hydrated: true, openProjectIds: state.openProjectIds.filter(id => projects.some(p => p.id === id)) }));
        }).catch(error=>{
            set({loadError:error instanceof Error?error.message:"프로젝트를 불러오지 못했습니다."});
            throw error;
        }).finally(() => { projectLoad = null;set({loading:false}); });
        return projectLoad;
    },
    createProjectFromCase: async (item) => {
        const existing = get().projects.find(p => sameCase(p, item));
        if (existing)
            return existing;
        const project = await cloudRequest<StudioProject>("projects", { input: { projectName: item.case_name?.trim() || "이름 없는 프로젝트", workType: inferWorkType(item.service_label), stage: inferStage(item.status), manager: item.name ?? "", email: item.email ?? "", deliveryDueDate: item.delivery_due_date }, sourceCase: item });
        set(s => ({ projects: [project, ...s.projects] }));
        return project;
    },
    createManualProject: async (input) => { const project = await cloudRequest<StudioProject>("projects", { input }); set(s => ({ projects: [project, ...s.projects] })); return project; },
    openProject: projectId => set(s => s.projects.some(p => p.id === projectId) ? { activeProjectId: projectId, openProjectIds: s.openProjectIds.includes(projectId) ? s.openProjectIds : [...s.openProjectIds, projectId] } : {}),
    openUnscopedWorkspace: () => set({ activeProjectId: null }),
    closeProjectTab: projectId => set(s => ({ openProjectIds: s.openProjectIds.filter(id => id !== projectId), activeProjectId: s.activeProjectId === projectId ? null : s.activeProjectId })),
    recordGenerationSet: (projectId, historyId, createdAt) => set(s => ({ projects: s.projects.map(p => p.id === projectId && !p.workHistory.some(w => w.id === historyId) ? { ...p, updatedAt: createdAt, workHistory: [{ id: historyId, kind: "generated_image", createdAt }, ...p.workHistory] } : p) })),
    recordDetailPageDraft: (projectId, workId, createdAt) => set(s => ({ projects: s.projects.map(p => p.id === projectId && !p.workHistory.some(w => w.id === workId) ? { ...p, updatedAt: createdAt, workHistory: [{ id: workId, kind: "detail_page", createdAt }, ...p.workHistory] } : p) })),
    markHydrated: () => set({ hydrated: true }),
    duplicateProject: async (projectId) => {
        const project = await cloudRequest<StudioProject>("duplicate-project", { id: projectId });
        set(state => ({ projects: [project, ...state.projects] }));
        return project;
    },
    deleteProject: async (projectId) => { await cloudRequest("delete-project", { id: projectId }); set(s => ({ projects: s.projects.filter(p => p.id !== projectId), openProjectIds: s.openProjectIds.filter(id => id !== projectId), activeProjectId: s.activeProjectId === projectId ? null : s.activeProjectId })); }
}), { name: "itda-studio-v2.1:project-tabs", skipHydration: true, partialize: state => ({ openProjectIds: state.openProjectIds }) }));
