import "server-only";
import { z } from "zod";
import { CloudError, list } from "./cloud-db";
import { brandAnalysisSchema } from "@/system/brand/brand-analysis";
async function checkBrand(brandId: string) {
 z.uuid().parse(brandId);
 if (!(await list<{ id: string }>("brands", `id=eq.${brandId}&deleted_at=is.null&select=id`)).length) throw new CloudError("브랜드를 찾을 수 없습니다.", 404);
}
// Python owns background execution and database writes. Next only authenticates
// the request, checks workspace scope and forwards the established API contract.
export async function callBrandAnalysis(id: string, trigger?: "initial" | "manual") {
 await checkBrand(id);
 const baseUrl = (process.env.CUT_EVALUATION_BASE_URL?.trim() || "http://localhost:8000").replace(/\/+$/, "");
 const response = await fetch(`${baseUrl}/api/v1/cut-evaluation/brand-analysis/brands/${id}${trigger ? "/analyze" : ""}`, {
   method: trigger ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(30_000),
   ...(trigger ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trigger, max_colors: 5 }) } : {}),
 });
 if (!response.ok) throw new CloudError(`브랜드 분석 서버 오류 (${response.status})`, 502);
 const parsed = brandAnalysisSchema.safeParse(await response.json());
 if (!parsed.success) throw new CloudError("브랜드 분석 응답 형식을 확인할 수 없습니다.", 502);
 return parsed.data;
}
