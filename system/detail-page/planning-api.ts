import type {
  PlanningGenerationResponse,
  RequestDocument,
} from "@/system/detail-page/detail-page-types";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";

type GeneratePlanningInput = {
  furnitureImage: string | null;
  requestDocument: RequestDocument | null;
  mockMode: boolean;
  onProgress?: (stage: "input" | "proposal") => void;
};

type PlanningStreamEvent =
  | { type: "progress"; stage: "input" | "proposal" }
  | { type: "result"; result: PlanningGenerationResponse }
  | { type: "error"; error: string };

async function readError(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error ?? "기획안을 생성하지 못했습니다.";
  } catch {
    return "기획안을 생성하지 못했습니다.";
  }
}

export async function generatePlanning(
  input: GeneratePlanningInput,
): Promise<PlanningGenerationResponse> {
  const form = new FormData();
  if (input.requestDocument) {
    form.append("request_document", input.requestDocument.file);
  }
  if (input.furnitureImage) {
    form.append("furniture_image", input.furnitureImage);
  }
  form.append("mock_mode", String(input.mockMode));

  const response = await fetch("/api/planning", {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.headers.get("content-type")?.includes("application/x-ndjson")) {
    if (!response.body) {
      throw new Error("기획안 생성 응답을 읽지 못했습니다.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: PlanningGenerationResponse | null = null;

    const handleLine = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line) as PlanningStreamEvent;
      if (event.type === "progress") {
        input.onProgress?.(event.stage);
      } else if (event.type === "result") {
        result = event.result;
      } else {
        throw new Error(event.error);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(handleLine);
      if (done) break;
    }
    handleLine(buffer);

    const completedResult = result as PlanningGenerationResponse | null;
    if (!completedResult) {
      throw new Error("기획안 생성 결과가 비어 있습니다.");
    }
    if (!completedResult.mock && completedResult.tokenUsage) {
      useTokenUsageStore.getState().recordUsage(completedResult.tokenUsage);
    }
    return completedResult;
  }

  const result = await response.json() as PlanningGenerationResponse;
  if (!result.mock && result.tokenUsage) {
    useTokenUsageStore.getState().recordUsage(result.tokenUsage);
  }
  return result;
}
