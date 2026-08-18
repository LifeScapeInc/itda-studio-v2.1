import type {
  PageGenerationRequest,
  PageGenerationResponse,
} from "@/system/detail-page/page-generation-types";

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
  return response.json() as Promise<PageGenerationResponse>;
}
