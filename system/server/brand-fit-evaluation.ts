import type { FidelityEvaluation } from "@/system/create/fidelity-evaluation";
import { resolveImage } from "./openai-image";

export async function evaluateBrandFit(
  generatedImage: string,
  brandId?: string | null,
): Promise<FidelityEvaluation> {
  if (!brandId) return { status: "not_applicable", reason: "브랜드 미지정" };
  try {
    const form = new FormData();
    form.set("brand_id", brandId);
    form.set("generated_image", await resolveImage(generatedImage, "generated"));
    const baseUrl = (process.env.CUT_EVALUATION_BASE_URL?.trim()
      || "http://localhost:8000").replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/api/v1/cut-evaluation/brandfit/predict`, {
      method: "POST", body: form, signal: AbortSignal.timeout(60_000), cache: "no-store",
    });
    if (!response.ok) throw new Error(`브랜드 적합성 평가 서버 오류 (${response.status})`);
    const result = await response.json() as {
      score?: unknown; model_version?: unknown; scoring_version?: unknown;
      status?: unknown; reason?: unknown;
    };
    if (result.status === "unavailable" || result.status === "not_applicable") {
      return { status: result.status, reason: typeof result.reason === "string" && result.reason.trim() ? result.reason : "브랜드 평가 근거가 부족합니다." };
    }
    const version = result.scoring_version ?? result.model_version;
    if (typeof result.score !== "number" || !Number.isFinite(result.score)
      || result.score < 0 || result.score > 100
      || typeof version !== "string" || !version.trim()) {
      throw new Error("브랜드 적합성 평가 응답이 올바르지 않습니다.");
    }
    return { status: "scored", score: result.score, modelVersion: version };
  } catch (error) {
    return { status: "unavailable", reason: error instanceof Error ? error.message : "브랜드 적합성을 평가하지 못했습니다." };
  }
}
