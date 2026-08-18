import { NextResponse } from "next/server";
import {
  MOCK_PLANNING_CANDIDATES,
  type PlanningGenerationResponse,
} from "@/system/detail-page/detail-page-types";
import {
  MOCK_PLANNING_REFERENCES,
  MOCK_PROCESSED_PLANNING_INPUT,
} from "@/system/detail-page/mock-detail-page-data";
import { getOpenAIApiKey } from "@/system/server/app-settings";
import { runOpenAIPlanning } from "@/system/server/openai-planning";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function mockResponse(): PlanningGenerationResponse {
  return {
    mock: true,
    sourceSummary: "국내산 오크 원목 테이블의 소재감, 다이닝 일상, 제작 과정의 신뢰라는 세 가지 방향으로 기획안을 구성했습니다.",
    candidates: MOCK_PLANNING_CANDIDATES,
    references: MOCK_PLANNING_REFERENCES,
    note: "설정의 목업 모드로 예시 기획안을 생성했습니다.",
    input: MOCK_PROCESSED_PLANNING_INPUT,
    metadata: { model: "debug-preview" },
  };
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : "기획안 생성 중 오류가 발생했습니다.";

  if (message.includes("Incorrect API key") || message.includes("401")) {
    return "API 키가 유효하지 않습니다. 설정에서 키를 확인해 주세요.";
  }
  if (message.includes("Rate limit") || message.includes("429")) {
    return "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("model_not_found")) {
    return "현재 API 프로젝트에서 기획 모델을 사용할 수 없습니다.";
  }
  return message;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const requestDocument = form.get("request_document");
    const furnitureImage = form.get("furniture_image");
    const mockMode = form.get("mock_mode") === "true";

    if (mockMode) {
      return NextResponse.json(mockResponse());
    }

    if (!(requestDocument instanceof File) || requestDocument.size === 0) {
      return NextResponse.json(
        { error: "의뢰 요청서 파일이 필요합니다." },
        { status: 400 },
      );
    }
    if (requestDocument.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "의뢰 요청서는 25MB 이하여야 합니다." },
        { status: 413 },
      );
    }
    if (typeof furnitureImage !== "string" || !furnitureImage.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "대상 가구 이미지가 필요합니다." },
        { status: 400 },
      );
    }

    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API 키가 연결되지 않았습니다. 설정에서 키를 연결하거나 목업 모드를 켜 주세요." },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        try {
          const result = await runOpenAIPlanning({
            apiKey,
            furnitureImage,
            requestDocument,
            onProgress: stage => send({ type: "progress", stage }),
          });
          send({ type: "result", result });
        } catch (error) {
          send({ type: "error", error: errorMessage(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 502 },
    );
  }
}
