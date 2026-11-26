"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createOptimisticRecord } from "@/system/cloud/optimistic-record";
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
    pendingProjectIds: string[];
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
const projectQueues = new Map<string, ReturnType<typeof createOptimisticRecord<StudioProject>>>();
let projectEpoch = 0;
const projectWrites = new Map<string, Promise<StudioProject | null>>();
function optimisticProject(id: string, update: (project: StudioProject | null) => StudioProject | null, save: (next: StudioProject | null, previous: StudioProject | null) => Promise<StudioProject | null>) {
    projectEpoch++;
    if (!projectQueues.has(id)) {
        const initial = useProjectStore.getState().projects.find(project => project.id === id) ?? null;
        const index = useProjectStore.getState().projects.findIndex(project => project.id === id);
        projectQueues.set(id, createOptimisticRecord(initial, (value, pending) => {
            projectEpoch++;
            useProjectStore.setState(state => {
                let projects = state.projects.filter(project => project.id !== id);
                if (value) { const currentIndex = state.projects.findIndex(project => project.id === id); projects = [...projects]; projects.splice(currentIndex >= 0 ? currentIndex : Math.max(0, index), 0, value); }
                return { projects, pendingProjectIds: pending ? [...new Set([...state.pendingProjectIds, id])] : state.pendingProjectIds.filter(item => item !== id) };
            });
            if (!pending) projectQueues.delete(id);
        }));
    }
    const task = projectQueues.get(id)!.enqueue(update, save);
    projectWrites.set(id, task);
    const clear = () => { if (projectWrites.get(id) === task) projectWrites.delete(id); };
    void task.then(clear, clear);
    return task;
}
function projectDraft(input: ManualProjectInput, sourceCase: IntegrationCase | null = null): StudioProject {
    const now = new Date().toISOString();
    return { id: crypto.randomUUID(), projectName: input.projectName, workType: input.workType, stage: input.stage, manager: input.manager ?? "", company: input.company ?? "", email: input.email ?? "", deliveryDueDate: input.deliveryDueDate ?? null, sourceCase, sourceCaseKey: sourceCase ? getCaseKey(sourceCase) : null, previewImages: [], workHistory: [], createdAt: now, updatedAt: now };
}
let projectLoad: Promise<void> | null = null;
export const useProjectStore = create<ProjectStore>()(persist((set, get) => ({
    projects: [], pendingProjectIds: [], activeProjectId: null, openProjectIds: [], hydrated: false, loading: false, loadError: null,
    hydrate: () => {
        if (projectLoad)
            return projectLoad;
        set({loading:true,loadError:null});
        const started = projectEpoch;
        projectLoad = cloudRequest<StudioProject[]>("projects").then(projects => {
            if (started === projectEpoch && !projectQueues.size) set(state => ({ projects, hydrated: true, openProjectIds: state.openProjectIds.filter(id => projects.some(p => p.id === id)) }));
            else set({ hydrated: true });
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
        const input: ManualProjectInput = { projectName: item.case_name?.trim() || "이름 없는 프로젝트", workType: inferWorkType(item.service_label), stage: inferStage(item.status), manager: item.name ?? "", email: item.email ?? "", deliveryDueDate: item.delivery_due_date };
        const draft = projectDraft(input, item);
        return (await optimisticProject(draft.id, () => draft, async () => cloudRequest<StudioProject>("projects", { id: draft.id, input, sourceCase: item })))!;
    },
    createManualProject: async input => {
        const draft = projectDraft(input);
        return (await optimisticProject(draft.id, () => draft, async () => cloudRequest<StudioProject>("projects", { id: draft.id, input })))!;
    },
    openProject: projectId => set(s => s.projects.some(p => p.id === projectId) ? { activeProjectId: projectId, openProjectIds: s.openProjectIds.includes(projectId) ? s.openProjectIds : [...s.openProjectIds, projectId] } : {}),
    openUnscopedWorkspace: () => set({ activeProjectId: null }),
    closeProjectTab: projectId => set(s => ({ openProjectIds: s.openProjectIds.filter(id => id !== projectId), activeProjectId: s.activeProjectId === projectId ? null : s.activeProjectId })),
    recordGenerationSet: (projectId, historyId, createdAt) => set(s => ({ projects: s.projects.map(p => p.id === projectId && !p.workHistory.some(w => w.id === historyId) ? { ...p, updatedAt: createdAt, workHistory: [{ id: historyId, kind: "generated_image", createdAt }, ...p.workHistory] } : p) })),
    recordDetailPageDraft: (projectId, workId, createdAt) => set(s => ({ projects: s.projects.map(p => p.id === projectId && !p.workHistory.some(w => w.id === workId) ? { ...p, updatedAt: createdAt, workHistory: [{ id: workId, kind: "detail_page", createdAt }, ...p.workHistory] } : p) })),
    markHydrated: () => set({ hydrated: true }),
    duplicateProject: async projectId => {
        const source = get().projects.find(project => project.id === projectId);
        if (!source) throw new Error("프로젝트를 찾을 수 없습니다.");
        const sourceWrite = projectWrites.get(projectId);
        const draft = { ...structuredClone(source), id: crypto.randomUUID(), projectName: `${source.projectName.slice(0, 294)} (복사본)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return (await optimisticProject(draft.id, () => draft, async () => {
            if (sourceWrite) await sourceWrite;
            const { flushWorkspaceSaves } = await import("@/system/cloud/workspace-sync");
            await flushWorkspaceSaves();
            return cloudRequest<StudioProject>("duplicate-project", { id: projectId, copyId: draft.id });
        }))!;
    },
    deleteProject: async projectId => {
        const tabs = get().openProjectIds;
        const active = get().activeProjectId;
        set(state => ({ openProjectIds: state.openProjectIds.filter(id => id !== projectId), activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId }));
        try { await optimisticProject(projectId, () => null, async (_next, previous) => { if (previous) await cloudRequest("delete-project", { id: projectId }); return null; }); }
        catch (error) {
            set(state => ({ openProjectIds: tabs.includes(projectId) ? [...new Set([...state.openProjectIds, projectId])] : state.openProjectIds, activeProjectId: !state.activeProjectId && active === projectId ? projectId : state.activeProjectId }));
            throw error;
        }
    },
}), { name: "itda-studio-v2.1:project-tabs", skipHydration: true, partialize: state => ({ openProjectIds: state.openProjectIds }) }));
