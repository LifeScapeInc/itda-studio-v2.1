import { evaluateFidelity } from "@/system/server/fidelity-evaluation";
import { evaluateBrandFit } from "@/system/server/brand-fit-evaluation";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { originalImage?: unknown; generatedImage?: unknown; brandId?: unknown } | null;
  if (!body || typeof body.originalImage !== "string" || !body.originalImage || typeof body.generatedImage !== "string" || !body.generatedImage) {
    return Response.json({ error: "평가할 원본 이미지와 생성 이미지가 필요합니다." }, { status: 400 });
  }
  if (body.brandId != null && (typeof body.brandId !== "string" || !body.brandId.trim())) {
    return Response.json({ error: "브랜드 ID가 올바르지 않습니다." }, { status: 400 });
  }
  const [fidelity, brandFit] = await Promise.all([
    evaluateFidelity(body.originalImage, body.generatedImage),
    evaluateBrandFit(body.generatedImage, body.brandId as string | null | undefined),
  ]);
  return Response.json({ fidelity, brandFit });
}
