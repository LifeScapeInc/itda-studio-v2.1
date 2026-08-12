import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";

export type ImageQuality = "low" | "medium" | "high";
export type ImageSize = `${number}x${number}` | "auto";

export const IMAGE_MODEL = "gpt-image-2" as const;

const SIZE_BY_RATIO: Record<GenerationRatio, ImageSize> = {
  "1:1": "1024x1024",
  "3:4": "1152x1536",
  "4:5": "1024x1280",
  "9:16": "1152x2048",
  "16:9": "2048x1152",
  original: "1536x1024",
};

export function mapQuality(quality: GenerationQuality): ImageQuality {
  return quality;
}

export function mapSize(ratio: GenerationRatio): ImageSize {
  return SIZE_BY_RATIO[ratio];
}
