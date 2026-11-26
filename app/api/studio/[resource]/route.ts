import { z } from "zod";
import { after } from "next/server";
import { callBrandAnalysis } from "@/system/server/brand-analysis";
import { requireCloudSession, checkMutationOrigin, cloudResponseError, cloudConfig, db } from "@/system/server/cloud-db";
import * as studio from "@/system/server/cloud-studio";
import { loadUsage } from "@/system/server/cloud-usage";
import type { GenerationHistorySet } from "@/system/create/generation-library";
import type { BrandCollection } from "@/system/brand/brand-library";
import type { IntegrationCase } from "@/system/integrations/cases";
export const runtime = "nodejs";
export const maxDuration = 60;
const uuid = z.uuid();
const kind = z.enum(["studio_cut", "detail_page"]);
const fidelity = z.discriminatedUnion("status", [
    z.object({ status: z.literal("scored"), score: z.number().min(0).max(100), modelVersion: z.string().min(1) }),
    z.object({ status: z.literal("unavailable"), reason: z.string() }), z.object({ status: z.literal("not_applicable"), reason: z.string() })
]);
const historySchema = z.object({ id: uuid, projectId: uuid.nullish(), version: z.number().int().nonnegative().optional(), title: z.string().min(1).max(300), createdAt: z.iso.datetime({ offset: true }), shots: z.array(z.object({ id: z.string().min(1).max(300), label: z.string(), ratio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9", "3:2", "original"]), resolution: z.string(), status: z.enum(["pending", "generating", "done", "error"]), imageUrl: z.string().optional(), error: z.string().optional(), bookmarked: z.boolean(), fidelity: fidelity.optional(), metadata: z.object({ finalPrompt: z.string(), generatedAt: z.string(), aiModel: z.string(), variationType: z.string(), quality: z.string(), editMode: z.string(), light: z.string(), mood: z.string(), props: z.array(z.string()), additionalDirection: z.string(), imageSize: z.string(), inputImages: z.array(z.object({ kind: z.enum(["product", "reference"]), label: z.string(), imageUrl: z.string() })).optional() }).passthrough() }).passthrough()).max(200) });
const brandSchema = z.object({ id: uuid, name: z.string().trim().min(1).max(120), version: z.number().int().positive(), createdAt: z.string(), updatedAt: z.string(), images: z.array(z.object({ id: z.string(), name: z.string(), imageUrl: z.string(), caseType: z.enum(["positive", "negative"]).optional() })).max(300) });
const projectSchema = z.object({ projectName: z.string().trim().min(1).max(300), workType: kind, stage: z.enum(["draft", "final"]), manager: z.string().optional(), company: z.string().optional(), email: z.string().optional(), deliveryDueDate: z.string().nullable().optional() });
const token = z.number().int().nonnegative();
const usageSchema = z.object({ id: uuid, occurredAt: z.iso.datetime({ offset: true }), usage: z.object({ total: token, inputText: token, inputImage: token, outputText: token, outputImage: token }), context: z.object({ key: z.string(), label: z.string(), detail: z.string().optional(), model: z.string().optional() }) });
export async function GET(request: Request, { params }: {
    params: Promise<{
        resource: string;
    }>;
}) {
    try {
        await requireCloudSession();
        const { resource } = await params;
        const search = new URL(request.url).searchParams;
        switch (resource) {
            case "projects": return Response.json(await studio.loadProjects());
            case "histories": return Response.json(await studio.loadHistories());
            case "brands": return Response.json(await studio.loadBrands());
            case "cases": return Response.json({ cases: await studio.loadCases() });
            case "bookmarks": return Response.json(await studio.loadBookmarks());
            case "workspace": return Response.json(await studio.loadWorkspace(kind.parse(search.get("kind")), search.get("projectId") ? uuid.parse(search.get("projectId")) : null));
            case "usage": return Response.json(await loadUsage());
            default: return new Response(null, { status: 404 });
        }
    }
    catch (error) {
        return error instanceof z.ZodError ? Response.json({ error: "요청 값이 올바르지 않습니다." }, { status: 400 }) : cloudResponseError(error);
    }
}
export async function POST(request: Request, { params }: {
    params: Promise<{
        resource: string;
    }>;
}) {
    try {
        await requireCloudSession();
        checkMutationOrigin(request);
        const { resource } = await params;
        const body = await request.json();
        switch (resource) {
            case "projects": {
                const input = projectSchema.parse(body.input);
                const sourceCase = body.sourceCase ? z.object({ id: z.string().nullish(), email: z.string().nullable(), name: z.string().nullable(), case_name: z.string().nullable(), delivery_due_date: z.string().nullable(), status: z.string().nullable(), service_label: z.string().nullable() }).passthrough().parse(body.sourceCase) as IntegrationCase : undefined;
                return Response.json(await studio.createProject(input, sourceCase, body.id === undefined ? undefined : uuid.parse(body.id)));
            }
            case "duplicate-project": return Response.json(await studio.duplicateProject(uuid.parse(body.id), body.copyId === undefined ? undefined : uuid.parse(body.copyId)));
            case "delete-project":
                await studio.deleteProject(uuid.parse(body.id));
                break;
            case "histories": return Response.json(await studio.saveHistory(historySchema.parse(body) as GenerationHistorySet));
            case "delete-history":
                await studio.deleteHistory(uuid.parse(body.id));
                break;
            case "brands": {
                const brand = brandSchema.parse(body.brand) as BrandCollection;
                const result = await studio.saveBrand(brand, z.number().int().nonnegative().parse(body.expectedVersion));
                if (brand.images.filter(image => image.caseType !== "negative").length >= 20) after(async () => {
                    try { await callBrandAnalysis(brand.id, "initial"); }
                    catch { console.error("Could not submit initial brand analysis", { brandId: brand.id }); }
                });
                return Response.json(result);
            }
            case "delete-brand":
                await studio.deleteBrand(uuid.parse(body.id), z.number().int().positive().parse(body.version));
                break;
            case "delete-bookmark":
                await studio.removeBookmark(uuid.parse(body.id));
                break;
            case "workspace": return Response.json(await studio.saveWorkspace(kind.parse(body.kind), uuid.nullable().parse(body.projectId), z.record(z.string(), z.unknown()).parse(body.state), z.number().int().nonnegative().parse(body.version)));
            case "usage": {
                const r = usageSchema.parse(body);
                const c = cloudConfig();
                await db("usage_records", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ id: r.id, workspace_id: c.workspace, model: r.context.model ?? "unknown", total: r.usage.total, input_text: r.usage.inputText, input_image: r.usage.inputImage, output_text: r.usage.outputText, output_image: r.usage.outputImage, context: r.context, occurred_at: r.occurredAt }) });
                break;
            }
            default: return new Response(null, { status: 404 });
        }
        return Response.json({ ok: true });
    }
    catch (error) {
        return error instanceof z.ZodError ? Response.json({ error: "저장할 데이터 형식을 확인해 주세요." }, { status: 400 }) : cloudResponseError(error);
    }
}
