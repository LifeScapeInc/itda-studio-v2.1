import { NextResponse } from "next/server";
import {
  DETAIL_TILE_DEFINITIONS,
  type PlanningCandidate,
  type TemplateStructureResponse,
} from "@/system/detail-page/detail-page-types";
import { MOCK_TEMPLATE_STRUCTURES } from "@/system/detail-page/mock-detail-page-data";
import { getOpenAIApiKey } from "@/system/server/app-settings";
import { runOpenAITemplateStructure } from "@/system/server/openai-template-structure";

function errorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : "템플릿 구조 생성 중 오류가 발생했습니다.";
  if (message.includes("Incorrect API key") || message.includes("401")) {
    return "API 키가 유효하지 않습니다. 설정에서 키를 확인해 주세요.";
  }
  if (message.includes("Rate limit") || message.includes("429")) {
    return "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return message;
}

function mockResponse(plan: PlanningCandidate): TemplateStructureResponse {
  const fallbackTiles = plan.tileTypes.flatMap(type => {
    const definition = DETAIL_TILE_DEFINITIONS.find(tile => tile.type === type);
    if (!definition) return [];
    return [{
      type,
      content: definition.description,
      imageLayout: definition.kind === "image" ? definition.prompt ?? "" : "",
      imageCount: definition.kind === "image"
        ? type === "hero" ? 1 : Math.min(4, definition.shotCount ?? 1)
        : 0,
    }];
  });
  return {
    mock: true,
    tiles: MOCK_TEMPLATE_STRUCTURES[plan.id] ?? fallbackTiles,
    note: "목업 템플릿 구조를 생성했습니다.",
    metadata: { model: "debug-preview" },
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const planValue = form.get("plan");
    const furnitureImage = form.get("furniture_image");
    const mockMode = form.get("mock_mode") === "true";
    if (typeof planValue !== "string") {
      return NextResponse.json({ error: "선택한 기획안이 필요합니다." }, { status: 400 });
    }
    const plan = JSON.parse(planValue) as PlanningCandidate;
    if (!plan.id || !Array.isArray(plan.tileTypes)) {
      return NextResponse.json({ error: "선택한 기획안 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (mockMode) {
      return NextResponse.json(mockResponse(plan));
    }
    if (typeof furnitureImage !== "string" || !furnitureImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "대상 가구 이미지가 필요합니다." }, { status: 400 });
    }
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API 키가 연결되지 않았습니다." },
        { status: 400 },
      );
    }
    return NextResponse.json(await runOpenAITemplateStructure({
      apiKey,
      furnitureImage,
      plan,
    }));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
