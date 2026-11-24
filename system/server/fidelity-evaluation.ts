import type { FidelityEvaluation } from "@/system/create/fidelity-evaluation";
import { resolveImage } from "./openai-image";

export async function evaluateFidelity(
  originalImage: string,
  generatedImage: string,
): Promise<FidelityEvaluation> {
  try {
    const [original, generated] = await Promise.all([
      resolveImage(originalImage, "original"),
      resolveImage(generatedImage, "generated"),
    ]);
    const form = new FormData();
    form.set("original_image", original);
    form.set("generated_image", generated);
    const baseUrl = (process.env.CUT_EVALUATION_BASE_URL?.trim()
      || "http://localhost:8000").replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/api/v1/cut-evaluation/fidelity/predict`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`객체 무결성 평가 서버 오류 (${response.status})`);
    }
    const result = await response.json() as { score?: unknown; model_version?: unknown };
    if (typeof result.score !== "number" || !Number.isFinite(result.score)
      || result.score < 0 || result.score > 100
      || typeof result.model_version !== "string" || !result.model_version.trim()) {
      throw new Error("객체 무결성 평가 응답이 올바르지 않습니다.");
    }
    return { status: "scored", score: result.score, modelVersion: result.model_version };
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : "객체 무결성을 평가하지 못했습니다.",
    };
  }
}
