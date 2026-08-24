import {
  ANGLE_VARIATION_OPTIONS,
  CONTENT_SET_OPTIONS,
  QUALITY_OPTIONS,
  type ContentSetId,
  type GenerationQuality,
} from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";
import type { TokenUsageContext } from "@/system/usage/token-usage";

type CutGenerationContextInput = {
  model: string;
  contentSet: ContentSetId | null;
  shotId: string;
  shotLabel: string;
  ratio: GenerationRatio;
  quality: GenerationQuality;
  hasReference: boolean;
};

function optionLabel(
  options: ReadonlyArray<{ id: string; label: string }>,
  id: string | null,
  fallback: string,
): string {
  return options.find(option => option.id === id)?.label ?? fallback;
}

function cutVariant(input: CutGenerationContextInput): {
  key: string;
  label: string;
} {
  const angle = ANGLE_VARIATION_OPTIONS.find(option => (
    input.shotId === `angle-${option.id}`
    || input.shotId.endsWith(`-angle-${option.id}`)
  ));
  if (angle) {
    return {
      key: `angle:${angle.id}`,
      label: `앵글 변주 · ${angle.label}`,
    };
  }

  if (input.contentSet === "free") {
    return {
      key: "content:free",
      label: "콘텐츠 세트 · 자유 생성 1회",
    };
  }

  const setLabel = optionLabel(
    CONTENT_SET_OPTIONS,
    input.contentSet,
    "기타",
  );
  return {
    key: `content:${input.contentSet ?? "unknown"}:${input.shotId}`,
    label: `콘텐츠 세트 · ${setLabel} · ${input.shotLabel}`,
  };
}

export function normalizeCutUsageContext(
  context: TokenUsageContext,
): TokenUsageContext {
  if (
    !context.key.startsWith("cut:")
    || !context.label.startsWith("콘텐츠 세트 · 기타 · ")
  ) {
    return context;
  }

  const angle = ANGLE_VARIATION_OPTIONS.find(option => (
    context.label.endsWith(option.label)
    || context.key.includes(`-angle-${option.id}:`)
  ));
  if (!angle) {
    return context;
  }

  const keyParts = context.key.split(":");
  const conditionParts = keyParts.slice(-3);
  const model = context.model ?? keyParts[1] ?? "unknown-image-model";

  return {
    ...context,
    key: ["cut", model, "angle", angle.id, ...conditionParts].join(":"),
    label: `앵글 변주 · ${angle.label}`,
  };
}

export function cutGenerationUsageContext(
  input: CutGenerationContextInput,
): TokenUsageContext {
  const variant = cutVariant(input);
  const referenceKey = input.hasReference ? "reference" : "product-only";
  const referenceLabel = input.hasReference
    ? "레퍼런스 있음"
    : "단일 제품 이미지";
  const qualityLabel = optionLabel(
    QUALITY_OPTIONS,
    input.quality,
    input.quality,
  );

  return {
    key: [
      "cut",
      input.model,
      variant.key,
      referenceKey,
      input.quality,
      input.ratio,
    ].join(":"),
    label: variant.label,
    detail: `${referenceLabel} · ${qualityLabel} · ${input.ratio}`,
    model: input.model,
  };
}

export function detailPlanningUsageContext(input: {
  model: string;
  hasFurnitureImage: boolean;
  hasRequestDocument: boolean;
}): TokenUsageContext {
  return {
    key: [
      "detail",
      input.model,
      "planning",
      input.hasFurnitureImage ? "furniture" : "no-furniture",
      input.hasRequestDocument ? "document" : "no-document",
    ].join(":"),
    label: "상세페이지 · 기획안 생성",
    detail: [
      input.hasFurnitureImage ? "제품 이미지 있음" : "제품 이미지 없음",
      input.hasRequestDocument ? "의뢰서 있음" : "의뢰서 없음",
    ].join(" · "),
    model: input.model,
  };
}

export function detailTemplateUsageContext(input: {
  model: string;
  hasFurnitureImage: boolean;
  tileCount: number;
}): TokenUsageContext {
  return {
    key: [
      "detail",
      input.model,
      "template",
      input.hasFurnitureImage ? "furniture" : "no-furniture",
      `tiles-${input.tileCount}`,
    ].join(":"),
    label: "상세페이지 · 템플릿 초안 생성",
    detail: `${input.hasFurnitureImage ? "제품 이미지 있음" : "제품 이미지 없음"} · ${input.tileCount}개 타일`,
    model: input.model,
  };
}

export function detailPageUsageContext(input: {
  model: string;
  phase: "layout" | "images" | "combined";
  tileCount: number;
  imageCount: number;
}): TokenUsageContext {
  return {
    key: [
      "detail",
      input.model,
      "page",
      input.phase,
      `tiles-${input.tileCount}`,
      `images-${input.imageCount}`,
    ].join(":"),
    label: input.phase === "layout"
      ? "상세페이지 · 최종 페이지 생성 · 레이아웃"
      : input.phase === "images"
        ? "상세페이지 · 최종 페이지 생성 · 이미지"
        : "상세페이지 · 최종 페이지 생성",
    detail: `${input.tileCount}개 타일 · 이미지 ${input.imageCount}장 생성`,
    model: input.model,
  };
}
