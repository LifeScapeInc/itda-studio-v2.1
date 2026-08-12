import {
  ANGLE_VARIATION_OPTIONS,
  type AngleVariationId,
  type ContentSetId,
} from "@/system/create/generation-options";

export type GenerationRatio =
  | "1:1"
  | "3:4"
  | "4:5"
  | "9:16"
  | "16:9"
  | "original";

export type GenerationShotStatus = "pending" | "generating" | "done" | "error";

export type GenerationShot = {
  id: string;
  label: string;
  ratio: GenerationRatio;
  resolution: string;
  status: GenerationShotStatus;
  imageUrl?: string;
  error?: string;
};

type ShotDefinition = Omit<GenerationShot, "status">;

const CONTENT_SET_SHOTS: Partial<Record<ContentSetId, ShotDefinition[]>> = {
  detail: [
    { id: "detail-hero", label: "메인 히어로", ratio: "3:4", resolution: "1152×1536" },
    { id: "detail-three-quarter", label: "45도 컷", ratio: "1:1", resolution: "1024×1024" },
    { id: "detail-closeup", label: "디테일 컷", ratio: "1:1", resolution: "1024×1024" },
    { id: "detail-lifestyle", label: "공간 연출 컷", ratio: "16:9", resolution: "2048×1152" },
  ],
  sns: [
    { id: "sns-square", label: "피드", ratio: "1:1", resolution: "1024×1024" },
    { id: "sns-portrait", label: "세로 피드", ratio: "4:5", resolution: "1024×1280" },
    { id: "sns-story", label: "스토리", ratio: "9:16", resolution: "1152×2048" },
    { id: "sns-ad", label: "광고용", ratio: "1:1", resolution: "1024×1024" },
  ],
  ad: [
    { id: "ad-wide", label: "배너 와이드", ratio: "16:9", resolution: "2048×1152" },
    { id: "ad-vertical", label: "배너 세로", ratio: "9:16", resolution: "1152×2048" },
    { id: "ad-thumbnail", label: "썸네일", ratio: "1:1", resolution: "1024×1024" },
  ],
  lookbook: [
    { id: "look-front", label: "전면", ratio: "3:4", resolution: "1152×1536" },
    { id: "look-side", label: "사이드", ratio: "3:4", resolution: "1152×1536" },
    { id: "look-lifestyle", label: "라이프스타일", ratio: "3:4", resolution: "1152×1536" },
    { id: "look-detail", label: "클로즈업", ratio: "3:4", resolution: "1152×1536" },
  ],
};

export type GenerationShotInput = {
  contentSet: ContentSetId | null;
  freeCount: number;
  angleVariationIds: AngleVariationId[];
};

function getAngleShots(
  angleVariationIds: AngleVariationId[],
): ShotDefinition[] {
  return ANGLE_VARIATION_OPTIONS
    .filter((option) => angleVariationIds.includes(option.id))
    .map((option) => ({
      id: `angle-${option.id}`,
      label: option.label,
      ratio: "original",
      resolution: "원본 해상도",
    }));
}

function getFreeShots(freeCount: number): ShotDefinition[] {
  const count = Math.min(8, Math.max(1, freeCount));

  return Array.from({ length: count }, (_, index) => ({
    id: `free-${index + 1}`,
    label: count > 1 ? `자유 생성 ${index + 1}` : "자유 생성",
    ratio: "1:1" as const,
    resolution: "1024×1024",
  }));
}

export function createGenerationShots(
  input: GenerationShotInput,
): GenerationShot[] {
  let definitions: ShotDefinition[] = [];

  if (input.angleVariationIds.length > 0) {
    definitions = getAngleShots(input.angleVariationIds);
  } else if (input.contentSet === "free") {
    definitions = getFreeShots(input.freeCount);
  } else if (input.contentSet) {
    definitions = CONTENT_SET_SHOTS[input.contentSet] ?? [];
  }

  return definitions.map((shot) => ({
    ...shot,
    status: "pending",
  }));
}

export function getRatioLabel(ratio: GenerationRatio): string {
  return ratio === "original" ? "원본 비율" : ratio;
}
