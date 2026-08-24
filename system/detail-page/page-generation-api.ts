import type {
  PageGenerationRequest,
  PageGenerationResponse,
} from "@/system/detail-page/page-generation-types";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";
import { detailPageUsageContext } from "@/system/usage/token-usage-context";

async function readError(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error ?? "상세페이지를 생성하지 못했습니다.";
  } catch {
    return "상세페이지를 생성하지 못했습니다.";
  }
}

export async function generateDetailPage(
  request: PageGenerationRequest,
): Promise<PageGenerationResponse> {
  const response = await fetch("/api/detail-page-generation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(await readError(response));
  const result = await response.json() as PageGenerationResponse;
  if (!result.mock && result.tokenUsage) {
    const imageCount = result.page.tiles.reduce(
      (count, tile) => count + tile.images.length,
      0,
    );
    const breakdown = result.tokenUsageByModel?.length
      ? result.tokenUsageByModel
      : [{
          model: [
            result.metadata?.layoutModel,
            result.metadata?.imageModel,
          ].filter(Boolean).join(" + ") || "unknown-mixed-model",
          phase: "combined" as const,
          usage: result.tokenUsage,
        }];

    breakdown.forEach((item) => {
      useTokenUsageStore.getState().recordUsage(
        item.usage,
        detailPageUsageContext({
          model: item.model,
          phase: item.phase,
          tileCount: result.page.tiles.length,
          imageCount,
        }),
      );
    });
  }
  return result;
}
