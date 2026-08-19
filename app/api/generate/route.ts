import type {
  GenerationApiRequest,
  GenerationApiResponse,
} from "@/system/create/generation-api";
import { getOpenAIApiKey } from "@/system/server/app-settings";
import { runOpenAIImageEdit } from "@/system/server/openai-image";

export const maxDuration = 300;  // static configuration of Next.js Route Handler

function isGenerationRequest(value: unknown): value is GenerationApiRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const request = value as Partial<GenerationApiRequest>;
  return typeof request.productImage === "string"
    && Boolean(request.productImage)
    && typeof request.prompt === "string"
    && Boolean(request.prompt.trim())
    && typeof request.quality === "string"
    && typeof request.ratio === "string";
}

function mockDimensions(ratio: GenerationApiRequest["ratio"]): [number, number] {
  const dimensions: Record<GenerationApiRequest["ratio"], [number, number]> = {
    "1:1": [1024, 1024],
    "3:4": [900, 1200],
    "4:5": [960, 1200],
    "9:16": [720, 1280],
    "16:9": [1280, 720],
    original: [1200, 900],
  };

  return dimensions[ratio];
}

function hashPrompt(prompt: string): number {
  return Array.from(prompt).reduce(
    (hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0,
    0,
  );
}

function mockImage(request: GenerationApiRequest): string {
  const [width, height] = mockDimensions(request.ratio);
  const seed = Math.abs(hashPrompt(request.prompt));
  const hue = seed % 36 + 28;
  const secondHue = (hue + 24) % 360;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    "<defs>",
    `<linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 22% 78%)"/><stop offset="1" stop-color="hsl(${secondHue} 18% 58%)"/></linearGradient>`,
    "</defs>",
    `<rect width="${width}" height="${height}" fill="url(#background)"/>`,
    `<rect x="${width * 0.17}" y="${height * 0.55}" width="${width * 0.66}" height="${height * 0.18}" rx="${Math.max(20, width * 0.035)}" fill="rgba(63,55,42,.42)"/>`,
    `<circle cx="${width * 0.72}" cy="${height * 0.33}" r="${Math.min(width, height) * 0.11}" fill="rgba(255,255,255,.24)"/>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : "이미지 생성 중 오류가 발생했습니다.";

  if (message.includes("Incorrect API key") || message.includes("401")) {
    return "API 키가 유효하지 않습니다. 설정에서 키를 확인해 주세요.";
  }
  if (message.includes("Rate limit") || message.includes("429")) {
    return "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("insufficient_quota")) {
    return "OpenAI API 잔액이 부족합니다.";
  }
  if (
    message.toLowerCase().includes("organization verification")
    || message.toLowerCase().includes("organization must be verified")
  ) {
    return "GPT Image 사용을 위해 OpenAI 조직 인증이 필요합니다. API 대시보드에서 조직 인증 상태를 확인해 주세요.";
  }
  if (message.includes("model_not_found")) {
    return "현재 API 프로젝트에서 GPT Image 2 모델을 사용할 수 없습니다.";
  }
  if (
    message.toLowerCase().includes("timeout")
    || message.toLowerCase().includes("timed out")
    || message.toLowerCase().includes("aborted")
  ) {
    return "이미지 생성이 배포 환경의 실행 시간 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (message.includes("Invalid image file or mode")) {
    return "입력 이미지 형식을 처리하지 못했습니다. PNG, JPG 또는 WebP 파일로 다시 시도해 주세요.";
  }
  if (message.includes("ENOENT")) {
    return "선택한 레퍼런스 이미지 파일을 찾지 못했습니다. 레퍼런스를 다시 선택해 주세요.";
  }

  return message;
}

function getErrorStatus(error: unknown, message: string): number {
  if (message.startsWith("이미지 생성이 배포 환경의 실행 시간 제한")) {
    return 504;
  }

  if (message.startsWith("API 키가 유효하지 않습니다")) {
    return 400;
  }

  if (
    message.startsWith("이미지 파일")
    || message.startsWith("입력 이미지")
    || message.startsWith("선택한 레퍼런스")
    || message.startsWith("레퍼런스 이미지 경로")
  ) {
    return 400;
  }

  if (error && typeof error === "object") {
    const status = (error as { status?: unknown }).status;
    if (
      typeof status === "number"
      && status >= 400
      && status < 500
    ) {
      return status;
    }
  }

  return 502;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
  }

  if (!isGenerationRequest(body)) {
    return Response.json({ error: "필수 생성 정보가 누락되었습니다." }, { status: 400 });
  }

  const apiKey = await getOpenAIApiKey();
  const useMock = Boolean(body.mockMode) || !apiKey;

  if (useMock) {
    const response: GenerationApiResponse = {
      mock: true,
      prompt: body.prompt,
      images: [mockImage(body)],
      note: body.mockMode
        ? "설정에서 목업 모드를 사용해 생성했습니다."
        : "API 키가 연결되지 않아 목업으로 생성했습니다.",
    };
    return Response.json(response);
  }

  try {
    const result = await runOpenAIImageEdit(body, apiKey);
    const response: GenerationApiResponse = {
      mock: false,
      prompt: body.prompt,
      images: result.images,
      usage: result.usage,
      note: `실제 생성 완료 · ${result.quality} · ${result.size}`,
    };
    return Response.json(response);
  } catch (error) {
    console.error("OpenAI image generation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      status: error && typeof error === "object"
        ? (error as { status?: unknown }).status
        : undefined,
      requestId: error && typeof error === "object"
        ? (error as { request_id?: unknown }).request_id
        : undefined,
    });
    const message = getErrorMessage(error);
    const status = getErrorStatus(error, message);

    return Response.json(
      { error: message },
      { status },
    );
  }
}
