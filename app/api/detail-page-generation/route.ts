import type { PageGenerationRequest } from "@/system/detail-page/page-generation-types";
import { getOpenAIApiKey } from "@/system/server/app-settings";
import {
  createMockDetailPage,
  runOpenAIDetailPage,
} from "@/system/server/openai-detail-page";

export const maxDuration = 300;  // static configuration of Next.js Route Handler

function isRequest(value: unknown): value is PageGenerationRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<PageGenerationRequest>;
  return Array.isArray(request.tiles)
    && request.tiles.length > 0
    && typeof request.mockMode === "boolean";
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : "상세페이지 생성 중 오류가 발생했습니다.";
  if (message.includes("Incorrect API key") || message.includes("401")) {
    return "API 키가 유효하지 않습니다. 설정에서 키를 확인해 주세요.";
  }
  if (message.includes("Rate limit") || message.includes("429")) {
    return "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("insufficient_quota")) {
    return "OpenAI API 잔액이 부족합니다.";
  }
  if (message.includes("model_not_found")) {
    return "현재 API 프로젝트에서 상세페이지 생성 모델을 사용할 수 없습니다.";
  }
  return message;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as unknown;
    if (!isRequest(body)) {
      return Response.json({ error: "상세페이지 생성 정보가 올바르지 않습니다." }, { status: 400 });
    }
    if (body.mockMode) return Response.json(createMockDetailPage());
    if (!body.planningInput) {
      return Response.json({ error: "가공된 의뢰 정보가 필요합니다." }, { status: 400 });
    }
    if (!body.furnitureImage?.startsWith("data:image/")) {
      return Response.json({ error: "대상 가구 이미지가 필요합니다." }, { status: 400 });
    }
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return Response.json({ error: "OpenAI API 키가 연결되지 않았습니다." }, { status: 400 });
    }
    return Response.json(await runOpenAIDetailPage({ apiKey, request: body }));
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 502 });
  }
}
