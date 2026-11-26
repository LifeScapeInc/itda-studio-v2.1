import { z } from "zod";
const measure = z.union([z.number().min(0).max(1), z.object({ value: z.number().min(0).max(1) }).passthrough()]);
const color = z.object({ hex: z.string().regex(/^#[0-9a-f]{6}$/i), name: z.string().optional(), description: z.string().optional() }).passthrough();
export const brandAnalysisResultSchema = z.object({
 palette: z.array(color).max(12), saturation: measure, brightness: measure,
 description: z.string().optional(),
 analyzed_at: z.string().optional(), analyzed_image_count: z.number().int().nonnegative().optional(), input_fingerprint: z.string().optional(),
}).passthrough();
export const brandAnalysisSchema = z.object({
 status: z.enum(["not_started", "insufficient_data", "queued", "running", "ready", "failed"]),
 result: brandAnalysisResultSchema.nullish(), error: z.string().nullish(), reason: z.string().nullish(),
}).passthrough().refine(value => value.status !== "ready" || Boolean(value.result), { message: "분석 완료 응답에 결과가 없습니다." });
export type BrandAnalysis = z.infer<typeof brandAnalysisSchema>;
export type BrandAnalysisResult = z.infer<typeof brandAnalysisResultSchema>;
export function analysisIsPending(analysis?: BrandAnalysis) { return analysis?.status === "queued" || analysis?.status === "running"; }
export function analysisMeasure(value: z.infer<typeof measure>) { return typeof value === "number" ? value : value.value; }
