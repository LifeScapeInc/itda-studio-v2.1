import type { StudioProject, ManualProjectInput } from "@/stores/useProjectStore";
import type { GenerationHistorySet } from "@/system/create/generation-library";

type Kind = StudioProject["workType"];
type Snapshot = Record<string, unknown> | null;
type DuplicateDependencies = {
 create: (input: ManualProjectInput, sourceCase: StudioProject["sourceCase"]) => Promise<StudioProject>;
 saveHistory: (history: GenerationHistorySet) => Promise<unknown>;
 saveWorkspace: (kind: Kind, projectId: string, state: Record<string, unknown>) => Promise<unknown>;
 removeProject: (id: string) => Promise<unknown>;
};

export function copyProjectData(projectId: string, histories: GenerationHistorySet[], workspaces: Record<Kind, Snapshot>, newId: () => string = () => crypto.randomUUID()) {
 const ids = new Map<string, string>();
 for (const history of histories) {
   ids.set(history.id, newId());
   for (const shot of history.shots) ids.set(shot.id, newId());
 }
 const remap = (value: unknown): unknown => {
   if (typeof value === "string") return ids.get(value) ?? value;
   if (Array.isArray(value)) return value.map(remap);
   if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remap(item)]));
   return value;
 };
 return {
   histories: histories.map(history => ({ ...remap(history) as GenerationHistorySet, projectId, version: 0 })),
   workspaces: Object.fromEntries(Object.entries(workspaces).map(([kind, state]) => [kind, state ? remap(state) : null])) as Record<Kind, Snapshot>,
 };
}

export async function duplicateProjectData(source: StudioProject, histories: GenerationHistorySet[], workspaces: Record<Kind, Snapshot>, dependencies: DuplicateDependencies) {
 const project = await dependencies.create({
   projectName: `${source.projectName.slice(0, 294)} (복사본)`, workType: source.workType, stage: source.stage,
   manager: source.manager, company: source.company, email: source.email, deliveryDueDate: source.deliveryDueDate,
 }, source.sourceCase);
 try {
   const copy = copyProjectData(project.id, histories, workspaces);
   for (const history of copy.histories) await dependencies.saveHistory(history);
   for (const kind of ["studio_cut", "detail_page"] as const) {
     const state = copy.workspaces[kind];
     if (state) await dependencies.saveWorkspace(kind, project.id, state);
   }
   return project;
 } catch (error) {
   // A failed copy must not leave an incomplete project in the project list.
   try { await dependencies.removeProject(project.id); }
   catch { throw new Error("프로젝트 복제를 완료하지 못했습니다. 미완성 복사본이 남아 있을 수 있으니 목록을 새로고침해 확인해 주세요."); }
   throw error;
 }
}
