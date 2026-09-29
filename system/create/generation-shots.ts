import {
  ANGLE_VARIATION_OPTIONS,
  normalizeFreeCount,
  type AngleVariationId,
  type ContentSetId,
} from "@/system/create/generation-options";

import { getRatioOption, type ImageRatio, type GenerationRatio } from "./generation-ratios";
export type { GenerationRatio } from "./generation-ratios";

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
    { id: "sns-portrait", label: "라이프스타일 피드", ratio: "4:5", resolution: "1024×1280" },
    { id: "sns-story", label: "스토리", ratio: "9:16", resolution: "1152×2048" },
    { id: "sns-ad", label: "광고용", ratio: "1:1", resolution: "1024×1024" },
  ],
  ad: [
    { id: "ad-wide", label: "카피 공간 배너", ratio: "16:9", resolution: "2048×1152" },
    { id: "ad-vertical", label: "텍스트 중심 배너", ratio: "9:16", resolution: "1152×2048" },
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
  aspectRatio?: ImageRatio;
  useSetRatios?: boolean;
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
  const count = normalizeFreeCount(freeCount);

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
    ...(input.aspectRatio && (
      input.contentSet === "free" || input.angleVariationIds.length > 0 || input.useSetRatios === false
    ) ? {
      ratio: input.aspectRatio,
      resolution: `${getRatioOption(input.aspectRatio).width}×${getRatioOption(input.aspectRatio).height}`,
    } : {}),
    status: "pending",
  }));
}

export function getRatioLabel(ratio: GenerationRatio): string {
  return ratio === "original" ? "원본 비율" : ratio;
}
