import type { ComponentType } from "react";
import {
  BookOpen,
  FileText,
  Images,
  Megaphone,
  SlidersHorizontal,
  type LucideProps,
} from "lucide-react";

export type ContentSetId = "detail" | "sns" | "ad" | "lookbook" | "free";
export type GenerationQuality = "low" | "medium" | "high";
export type AngleVariationId =
  | "closeup"
  | "reverse"
  | "editorial"
  | "architectural"
  | "wide";
export type FurnitureType =
  | "소파"
  | "1인 소파"
  | "암 체어"
  | "다이닝 체어"
  | "스툴"
  | "빈백"
  | "수납장"
  | "서랍장";

export type ContentSetOption = {
  id: ContentSetId;
  label: string;
  description: string;
  cutCount: number | null;
  icon: ComponentType<LucideProps>;
};

export type AngleVariationOption = {
  id: AngleVariationId;
  label: string;
  shotRole: string;
  compositionPrompt: string;
  techniquePrompt: string;
};

export const FURNITURE_TYPE_OPTIONS: FurnitureType[] = [
  "소파",
  "1인 소파",
  "암 체어",
  "다이닝 체어",
  "스툴",
  "빈백",
  "수납장",
  "서랍장",
];

export const CONTENT_SET_OPTIONS: ContentSetOption[] = [
  {
    id: "detail",
    label: "상세페이지",
    description: "제품 소개에 필요한 기본 구성",
    cutCount: 4,
    icon: FileText,
  },
  {
    id: "sns",
    label: "SNS",
    description: "피드와 스토리에 맞춘 구성",
    cutCount: 4,
    icon: Images,
  },
  {
    id: "ad",
    label: "광고",
    description: "배너와 썸네일 중심 구성",
    cutCount: 3,
    icon: Megaphone,
  },
  {
    id: "lookbook",
    label: "룩북",
    description: "브랜드 카탈로그형 구성",
    cutCount: 4,
    icon: BookOpen,
  },
  {
    id: "free",
    label: "자유 생성",
    description: "필요한 장 수를 직접 설정",
    cutCount: null,
    icon: SlidersHorizontal,
  },
];

export const ANGLE_VARIATION_OPTIONS: AngleVariationOption[] = [
  {
    id: "closeup",
    label: "고감도 클로즈업",
    shotRole: "move much closer and fill the frame with the main piece",
    compositionPrompt: "eye level, straight on",
    techniquePrompt:
      "macro photography with a very shallow depth of field, razor-thin plane of focus on the material surface, tactile rendering of grain, weave, and finish",
  },
  {
    id: "reverse",
    label: "리버스 앵글",
    shotRole:
      "cross to the opposite side of the room and shoot back toward the original camera position",
    compositionPrompt: "a three-quarter 45-degree angle",
    techniquePrompt:
      "shot on an 85–135mm telephoto lens, compressed perspective that flattens depth and keeps vertical lines parallel, subject isolated from a softly defocused background",
  },
  {
    id: "editorial",
    label: "에디토리얼 텔레포토",
    shotRole:
      "step back and shoot straight on from eye level with a long lens",
    compositionPrompt: "eye level, straight on",
    techniquePrompt:
      "shot on an 85–135mm telephoto lens, compressed perspective that flattens depth and keeps vertical lines parallel, subject isolated from a softly defocused background",
  },
  {
    id: "architectural",
    label: "로우앵글 아키텍처럴",
    shotRole: "drop close to floor height and shoot slightly upward",
    compositionPrompt: "a low angle, shooting slightly upward",
    techniquePrompt:
      "shot with a tilt-shift architectural lens, perfectly vertical wall lines with no keystone distortion, deep front-to-back sharpness, precise interior-magazine framing",
  },
  {
    id: "wide",
    label: "와이드 환경샷",
    shotRole: "pull back to take in the whole room",
    compositionPrompt: "wide, with generous negative space",
    techniquePrompt:
      "shot on a 24–35mm wide lens from a comfortable standing distance, showing the full room context and how the piece sits in the space, corrected for distortion",
  },
];

export const QUALITY_OPTIONS = [
  { id: "low", label: "Draft", description: "빠른 시안" },
  { id: "medium", label: "Normal", description: "기본 품질" },
  { id: "high", label: "High", description: "고해상도" },
] as const;

export const QUALITY_COST: Record<GenerationQuality, number> = {
  low: 60,
  medium: 120,
  high: 220,
};

export const EDIT_MODE_OPTIONS = [
  { id: "swap", label: "제품 교체" },
  { id: "mood", label: "분위기 보정" },
  { id: "material", label: "재질/색상 변경" },
] as const;

export function normalizeFreeCount(freeCount: number): number {
  if (!Number.isFinite(freeCount)) return 1;
  return Math.max(1, Math.floor(freeCount));
}

export const LIGHT_OPTIONS = [
  "아침 햇살",
  "노을빛",
  "부드러운 스튜디오",
  "드라마틱 대비",
];

export const MOOD_OPTIONS = [
  "모던 미니멀",
  "따뜻 포근",
  "럭셔리",
  "빈티지",
];

export const PROP_OPTIONS = [
  "식물",
  "러그",
  "커피/책",
  "벽 장식",
];

export function getCutCount(
  contentSet: ContentSetId | null,
  freeCount: number,
  angleVariationIds: AngleVariationId[] = [],
): number {
  if (angleVariationIds.length > 0) {
    return angleVariationIds.length;
  }

  if (!contentSet) {
    return 0;
  }

  if (contentSet === "free") {
    return normalizeFreeCount(freeCount);
  }

  return CONTENT_SET_OPTIONS.find(
    (option) => option.id === contentSet,
  )?.cutCount ?? 0;
}

export function getEstimatedCost(
  contentSet: ContentSetId | null,
  freeCount: number,
  quality: GenerationQuality,
  angleVariationIds: AngleVariationId[] = [],
): number {
  return getCutCount(
    contentSet,
    freeCount,
    angleVariationIds,
  ) * QUALITY_COST[quality];
}
