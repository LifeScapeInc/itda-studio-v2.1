import { evaluateFidelity } from "@/system/server/fidelity-evaluation";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { originalImage?: unknown; generatedImage?: unknown } | null;
  if (!body || typeof body.originalImage !== "string" || !body.originalImage || typeof body.generatedImage !== "string" || !body.generatedImage) {
    return Response.json({ error: "평가할 원본 이미지와 생성 이미지가 필요합니다." }, { status: 400 });
  }
  return Response.json({ fidelity: await evaluateFidelity(body.originalImage, body.generatedImage) });
}
