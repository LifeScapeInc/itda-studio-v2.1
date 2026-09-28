import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";
import { getRatioOption } from "@/system/create/generation-ratios";

export type ImageQuality = "low" | "medium" | "high";
export type ImageSize = `${number}x${number}` | "auto";

export const IMAGE_MODEL = "gpt-image-2" as const;

export function mapQuality(quality: GenerationQuality): ImageQuality {
  return quality;
}

export function mapSize(ratio: GenerationRatio): ImageSize {
  if (ratio === "original") return "auto";
  const option = getRatioOption(ratio);
  return `${option.width}x${option.height}`;
}
