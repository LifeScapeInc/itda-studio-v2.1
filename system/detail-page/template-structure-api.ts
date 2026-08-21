import type {
  PlanningCandidate,
  TemplateStructureResponse,
} from "@/system/detail-page/detail-page-types";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";

async function readError(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error ?? "템플릿 구조를 생성하지 못했습니다.";
  } catch {
    return "템플릿 구조를 생성하지 못했습니다.";
  }
}

export async function generateTemplateStructure({
  furnitureImage,
  mockMode,
  plan,
}: {
  furnitureImage: string | null;
  mockMode: boolean;
  plan: PlanningCandidate;
}): Promise<TemplateStructureResponse> {
  const form = new FormData();
  form.append("plan", JSON.stringify(plan));
  form.append("mock_mode", String(mockMode));
  if (furnitureImage) form.append("furniture_image", furnitureImage);

  const response = await fetch("/api/template-structure", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const result = await response.json() as TemplateStructureResponse;
  if (!result.mock && result.tokenUsage) {
    useTokenUsageStore.getState().recordUsage(result.tokenUsage);
  }
  return result;
}
