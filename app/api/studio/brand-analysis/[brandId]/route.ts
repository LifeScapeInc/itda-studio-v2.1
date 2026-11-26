import { z } from "zod";
import { requireCloudSession, checkMutationOrigin, cloudResponseError } from "@/system/server/cloud-db";
import { callBrandAnalysis } from "@/system/server/brand-analysis";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ brandId: string }> };
export async function GET(_request: Request, { params }: Context) {
 try {
   await requireCloudSession();
   const { brandId } = await params;
   const analysis = await callBrandAnalysis(brandId);
   return Response.json(analysis);
 }
 catch (error) { return error instanceof z.ZodError ? Response.json({ error: "브랜드 ID가 올바르지 않습니다." }, { status: 400 }) : cloudResponseError(error); }
}
export async function POST(request: Request, { params }: Context) {
 try {
   await requireCloudSession(); checkMutationOrigin(request);
   const { trigger } = z.object({ trigger: z.enum(["initial", "manual"]) }).parse(await request.json());
   const { brandId } = await params;
   const analysis = await callBrandAnalysis(brandId, trigger);
   return Response.json(analysis);
 } catch (error) { return error instanceof z.ZodError ? Response.json({ error: "분석 요청 형식을 확인해 주세요." }, { status: 400 }) : cloudResponseError(error); }
}
