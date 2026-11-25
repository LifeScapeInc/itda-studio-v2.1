import "server-only";
import { duplicateProjectData } from "@/system/projects/duplicate-project";
import { createHash } from "node:crypto";
import { z } from "zod";
import { cloudConfig, CloudError, db, list, rpc } from "./cloud-db";
import { assetId, assetUrl } from "./cloud-assets";
import type { GenerationHistorySet, LibraryGenerationShot, GenerationImageMetadata } from "@/system/create/generation-library";
import type { StudioProject, ManualProjectInput } from "@/stores/useProjectStore";
import type { BrandCollection } from "@/system/brand/brand-library";
import type { IntegrationCase } from "@/system/integrations/cases";
import { getCaseKey } from "@/system/integrations/cases";
import type { FidelityEvaluation } from "@/system/create/fidelity-evaluation";
export const uuid = z.uuid();
export function stableId(key: string) {
    const h = createHash("sha256").update("itda-local-import-v1:" + key).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const canonicalId = (id: string, key: string) => uuid.safeParse(id).success ? id : stableId(key);
function commit<T>(operation: string, data: unknown) { const c = cloudConfig(); return rpc<T>("studio_commit", { p_workspace: c.workspace, p_owner: c.owner, p_operation: operation, p_data: data }); }
export function collectAssets(value: unknown, found = new Set<string>()) {
    if (typeof value === "string") {
        const id = assetId(value);
        if (id)
            found.add(id);
        if (value.startsWith("data:") || value.startsWith("blob:"))
            throw new CloudError("파일 업로드가 끝나지 않았습니다.", 400);
    }
    else if (Array.isArray(value))
        value.forEach(v => collectAssets(v, found));
    else if (value && typeof value === "object")
        Object.values(value).forEach(v => collectAssets(v, found));
    return [...found];
}
async function checkedAssets(value: unknown) {
    const ids = collectAssets(value);
    for (let i = 0; i < ids.length; i += 100) {
        const part = ids.slice(i, i + 100);
        const rows = await list<{
            id: string;
        }>("assets", `id=in.(${part.join(",")})&status=eq.ready&deleted_at=is.null&select=id`);
        if (rows.length !== part.length)
            throw new CloudError("사용할 수 없는 파일이 포함되어 있습니다.", 400);
    }
    return ids;
}
async function activeProjects() {
    return list<{
        id: string;
    }>("projects", "deleted_at=is.null&select=id");
}
type HistoryRow = {
    id: string;
    project_id: string | null;
    work_id: string;
    title: string;
    created_at: string;
};
type ShotRow = {
    id: string;
    history_id: string;
    label: string;
    position: number;
    ratio: LibraryGenerationShot["ratio"];
    resolution: string;
    asset_id: string | null;
    final_prompt: string;
    settings: GenerationImageMetadata & {
        _clientId?: string;
        status?: LibraryGenerationShot["status"];
        error?: string;
        source_shot?: Partial<LibraryGenerationShot>;
    };
    model: string;
    generated_at: string | null;
};
type InputRow = {
    shot_id: string;
    asset_id: string;
    role: string;
    label: string;
    position: number;
};
type EvaluationRow = {
    id: string;
    asset_id: string;
    original_asset_id: string | null;
    status: FidelityEvaluation["status"];
    score: number | null;
    model_version: string | null;
    reason: string | null;
    evaluated_at: string;
};
type RevisionRow = {
    id: string;
    work_id: string;
    lock_version: number;
    state: {
        kind?: string;
        snapshot?: Record<string, unknown>;
    };
};
type BookmarkRow = {
    asset_id: string;
    snapshot?: LibraryGenerationShot;
    created_at: string;
};
export async function loadHistories(): Promise<GenerationHistorySet[]> {
    const { owner } = cloudConfig();
    const [all, projects, shots, inputs, evaluations, bookmarks, revisions] = await Promise.all([
        list<HistoryRow>("generation_histories", "deleted_at=is.null&order=created_at.desc,id"), activeProjects(),
        list<ShotRow>("generation_shots", "deleted_at=is.null&order=position,id"), list<InputRow>("generation_shot_inputs", "order=position,shot_id"),
        list<EvaluationRow>("image_evaluations", "order=evaluated_at.desc,id"), list<BookmarkRow>("bookmarks", `user_id=eq.${owner}&order=created_at,asset_id`),
        list<RevisionRow>("work_revisions", "is_draft=eq.true&select=id,work_id,lock_version,state&order=id")
    ]);
    const active = new Set(projects.map(p => p.id));
    return all.filter(h => !h.project_id || active.has(h.project_id)).map(h => ({ id: h.id, projectId: h.project_id, title: h.title, createdAt: h.created_at,
        version: revisions.find(r => r.work_id === h.work_id)?.lock_version ?? 1,
        shots: shots.filter(s => s.history_id === h.id).map(s => {
            const m = s.settings;
            const sourceInputs = inputs.filter(i => i.shot_id === s.id);
            const original = sourceInputs.find(i => i.role === "product")?.asset_id;
            const evaluation = evaluations.find(e => e.asset_id === s.asset_id && e.original_asset_id === (original ?? null));
            const interrupted = !s.asset_id && (m.status === "pending" || m.status === "generating");
            return { id: m._clientId ?? s.id, label: s.label, ratio: s.ratio, resolution: s.resolution, status: s.asset_id ? "done" : interrupted ? "error" : m.status ?? "error", imageUrl: s.asset_id ? assetUrl(s.asset_id) : undefined,
                error: interrupted ? "중단된 생성입니다. 다시 생성해 주세요." : m.error, bookmarked: bookmarks.some(b => b.asset_id === s.asset_id),
                fidelity: evaluation ? (evaluation.status === "scored" ? { status: "scored", score: Number(evaluation.score), modelVersion: evaluation.model_version! } : { status: evaluation.status, reason: evaluation.reason! }) : undefined,
                metadata: { ...m, finalPrompt: s.final_prompt, aiModel: s.model, generatedAt: s.generated_at ?? h.created_at, inputImages: sourceInputs.map(i => ({ kind: i.role === "product" ? "product" : "reference", label: i.label, imageUrl: assetUrl(i.asset_id) })) } };
        }) }));
}
export async function saveHistory(history: GenerationHistorySet) {
    await preserveImportedBookmarks();
    uuid.parse(history.id);
    if (history.projectId)
        uuid.parse(history.projectId);
    const assets = await checkedAssets(history);
    const shots = history.shots.map((s, position) => {
        const file = s.imageUrl ? assetId(s.imageUrl) : null;
        if (s.imageUrl && !file)
            throw new CloudError("생성 결과를 먼저 업로드해 주세요.", 400);
        const counts: Record<string, number> = {};
        const inputs = (s.metadata.inputImages ?? []).map(i => {
            const id = assetId(i.imageUrl);
            if (!id)
                throw new CloudError("입력 이미지를 먼저 업로드해 주세요.", 400);
            return { asset_id: id, role: i.kind, label: i.label, position: counts[i.kind] === undefined ? (counts[i.kind] = 0) : ++counts[i.kind] };
        });
        const fidelity = s.fidelity;
        const original = inputs.find(i => i.role === "product")?.asset_id;
        return { id: canonicalId(s.id, `shot:${history.id}:${s.id}`), label: s.label, position, ratio: s.ratio, resolution: s.resolution, asset_id: file, final_prompt: s.metadata.finalPrompt,
            settings: { ...s.metadata, _clientId: s.id, status: s.status, error: s.error }, model: s.metadata.aiModel, is_mock: /mock|debug/i.test(s.metadata.aiModel), generated_at: s.metadata.generatedAt || null,
            inputs, bookmarked: s.bookmarked, bookmark_snapshot: s,
            evaluation: file && fidelity ? { id: stableId(`evaluation:${file}:${original}:${JSON.stringify(fidelity)}`), original_asset_id: original ?? null, status: fidelity.status, score: fidelity.status === "scored" ? fidelity.score : null, model_version: fidelity.status === "scored" ? fidelity.modelVersion : null, reason: fidelity.status === "scored" ? null : fidelity.reason } : null };
    });
    return commit<{
        version: number;
    }>("history", { id: history.id, project_id: history.projectId ?? null, title: history.title, created_at: history.createdAt,
        expected_version: history.version ?? 0, work_id: stableId(`history-work:${history.id}`), revision_id: stableId(`history-revision:${history.id}`), state: { kind: "history", history }, shots, assets });
}
export async function deleteHistory(id: string) {
    await preserveImportedBookmarks();
    return commit("delete_history", { id: uuid.parse(id) });
}
type CaseRow = {
    id: string;
    request_data: IntegrationCase;
    name: string;
    email: string | null;
    customer_name: string | null;
    delivery_due_date: string | null;
    status: string;
    service_label: string | null;
    external_case_id: string | null;
};
type ProjectRow = {
    id: string;
    name: string;
    work_type: StudioProject["workType"];
    stage: StudioProject["stage"];
    manager: string;
    company: string;
    email: string;
    delivery_due_date: string | null;
    case_id: string | null;
    created_at: string;
    updated_at: string;
};
export async function loadCases() {
    const [cases, projects] = await Promise.all([list<CaseRow>("request_cases", "order=created_at.desc,id"), list<ProjectRow>("projects", "deleted_at=is.null&order=created_at.desc,id")]);
    return cases.map(c => ({ ...c.request_data, id: c.external_case_id ?? c.id, email: c.email, name: c.customer_name, case_name: c.name, delivery_due_date: c.delivery_due_date, status: c.status, service_label: c.service_label, project_exists: projects.some(p => p.case_id === c.id), project_id: projects.find(p => p.case_id === c.id)?.id ?? null }));
}
export async function loadProjects(): Promise<StudioProject[]> {
    const [projects, cases, histories, works] = await Promise.all([list<ProjectRow>("projects", "deleted_at=is.null&order=created_at.desc,id"), list<CaseRow>("request_cases", "order=id"), list<HistoryRow>("generation_histories", "deleted_at=is.null&order=created_at.desc,id"), list<{
            id: string;
            project_id: string | null;
            kind: string;
            created_at: string;
        }>("project_works", "deleted_at=is.null&order=created_at.desc,id")]);
    return projects.map(p => {
        const c = cases.find(c => c.id === p.case_id);
        return { id: p.id, projectName: p.name, workType: p.work_type, stage: p.stage, manager: p.manager, company: p.company, email: p.email, deliveryDueDate: p.delivery_due_date,
            sourceCase: c?.request_data ?? null, sourceCaseKey: c ? getCaseKey(c.request_data) : null, previewImages: [], createdAt: p.created_at, updatedAt: p.updated_at,
            workHistory: works.filter(w => w.project_id === p.id).map(w => ({ id: histories.find(h => h.work_id === w.id)?.id ?? w.id, kind: w.kind === "studio_cut" ? "generated_image" : "detail_page", createdAt: w.created_at })) };
    });
}
export async function createProject(input: ManualProjectInput, sourceCase?: IntegrationCase) {
    const id = crypto.randomUUID();
    const caseKey = sourceCase ? getCaseKey(sourceCase) : null;
    await commit("project", { id, name: input.projectName, work_type: input.workType, stage: input.stage, manager: input.manager, company: input.company, email: input.email, delivery_due_date: input.deliveryDueDate, source_case: sourceCase ? { ...sourceCase, case_name: sourceCase.case_name || input.projectName } : undefined, case_key: caseKey, case_id: caseKey ? stableId(`case:${caseKey}`) : null });
    return (await loadProjects()).find(p => p.id === id)!;
}
export async function deleteProject(id: string) { return commit("delete_project", { id: uuid.parse(id) }); }
type BrandRow = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    lock_version: number;
};
type BrandAssetRow = {
    brand_id: string;
    asset_id: string;
    name: string;
    case_type?: "positive" | "negative";
    position: number;
};
export async function loadBrands(): Promise<BrandCollection[]> {
    const [brands, images] = await Promise.all([list<BrandRow>("brands", "deleted_at=is.null&order=created_at.desc,id"), list<BrandAssetRow>("brand_assets", "order=position,asset_id")]);
    return brands.map(b => ({ id: b.id, name: b.name, version: b.lock_version, createdAt: b.created_at, updatedAt: b.updated_at, images: images.filter(i => i.brand_id === b.id).map(i => ({ id: i.asset_id, name: i.name, imageUrl: assetUrl(i.asset_id), caseType: i.case_type ?? undefined })) }));
}
export async function saveBrand(brand: BrandCollection, expected: number) {
    uuid.parse(brand.id);
    await checkedAssets(brand);
    return commit<{
        version: number;
    }>("brand", { id: brand.id, name: brand.name, expected_version: expected, images: brand.images.map((image, position) => {
            const id = assetId(image.imageUrl);
            if (!id)
                throw new CloudError("브랜드 이미지를 먼저 업로드해 주세요.", 400);
            return { asset_id: id, name: image.name, case_type: image.caseType ?? null, position };
        }) });
}
export async function deleteBrand(id: string, version: number) { return commit("delete_brand", { id: uuid.parse(id), expected_version: version }); }
export async function loadWorkspace(kind: string, projectId: string | null) {
    if (projectId)
        uuid.parse(projectId);
    const { workspace } = cloudConfig();
    const work = stableId(`editor-work:${workspace}:${projectId ?? "unscoped"}:${kind}`);
    const rows = await list<RevisionRow>("work_revisions", `work_id=eq.${work}&is_draft=eq.true&order=id`);
    if (projectId && !(await activeProjects()).some(p => p.id === projectId))
        throw new CloudError("프로젝트를 찾을 수 없습니다.", 404);
    return { state: rows[0]?.state.snapshot ?? null, version: rows[0]?.lock_version ?? 0 };
}
export async function saveWorkspace(kind: string, projectId: string | null, state: unknown, version: number) {
    if (projectId)
        uuid.parse(projectId);
    const { workspace } = cloudConfig();
    const work = stableId(`editor-work:${workspace}:${projectId ?? "unscoped"}:${kind}`);
    return commit<{
        version: number;
    }>("workspace", { id: work, work_id: work, revision_id: stableId(`editor-revision:${work}`), kind, project_id: projectId, expected_version: version, state, assets: await checkedAssets(state), title: kind === "studio_cut" ? "컷 생성 작업" : "상세 페이지 작업" });
}
export async function loadBookmarks() {
    const { owner } = cloudConfig();
    const [bookmarks, histories] = await Promise.all([list<BookmarkRow>("bookmarks", `user_id=eq.${owner}&order=created_at.desc,asset_id`), loadHistories()]);
    return bookmarks.map(b => {
        const live = histories.flatMap(h => h.shots).find(s => s.imageUrl === assetUrl(b.asset_id));
        const snapshot = b.snapshot && Object.keys(b.snapshot).length ? b.snapshot : live;
        return { ...snapshot, id: `bookmark:${b.asset_id}`, label: snapshot?.label ?? "저장한 이미지", ratio: snapshot?.ratio ?? "original", resolution: snapshot?.resolution ?? "", status: "done", bookmarked: true, imageUrl: assetUrl(b.asset_id), metadata: snapshot?.metadata ?? { finalPrompt: "", generatedAt: b.created_at, aiModel: "", variationType: "", quality: "", editMode: "", light: "", mood: "", props: [], additionalDirection: "", imageSize: "" } } as LibraryGenerationShot;
    });
}
export async function removeBookmark(id: string) { const { workspace, owner } = cloudConfig(); await db(`bookmarks?workspace_id=eq.${workspace}&user_id=eq.${owner}&asset_id=eq.${uuid.parse(id)}`, { method: "DELETE" }); }
async function preserveImportedBookmarks() {
    const { workspace, owner } = cloudConfig();
    const bookmarks = await list<BookmarkRow>("bookmarks", `user_id=eq.${owner}&order=asset_id`);
    const pending = bookmarks.filter(b => !b.snapshot || !Object.keys(b.snapshot).length);
    if (!pending.length)
        return;
    const histories = await loadHistories();
    for (const bookmark of pending) {
        const shot = histories.flatMap(h => h.shots).find(s => s.imageUrl === assetUrl(bookmark.asset_id));
        if (shot)
            await db(`bookmarks?workspace_id=eq.${workspace}&user_id=eq.${owner}&asset_id=eq.${bookmark.asset_id}`, { method: "PATCH", body: JSON.stringify({ snapshot: shot }) });
    }
}

export async function duplicateProject(id: string): Promise<StudioProject> {
    uuid.parse(id);
    const source = (await loadProjects()).find(project => project.id === id);
    if (!source) throw new CloudError("프로젝트를 찾을 수 없습니다.", 404);
    const [histories, cuts, detail] = await Promise.all([loadHistories(), loadWorkspace("studio_cut", id), loadWorkspace("detail_page", id)]);
    const project = await duplicateProjectData(source, histories.filter(history => history.projectId === id), { studio_cut: cuts.state, detail_page: detail.state }, {
        create: (input, sourceCase) => createProject(input, sourceCase ?? undefined),
        saveHistory,
        saveWorkspace: (kind, projectId, state) => saveWorkspace(kind, projectId, state, 0),
        removeProject: deleteProject,
    });
    return (await loadProjects()).find(item => item.id === project.id) ?? project;
}
