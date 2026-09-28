// All sizes meet GPT Image 2's 16px grid, 3:1 aspect and pixel-count limits.
export const IMAGE_RATIO_OPTIONS = [
  { ratio: "9:16", width: 1152, height: 2048 },
  { ratio: "2:3", width: 1024, height: 1536 },
  { ratio: "3:4", width: 1152, height: 1536 },
  { ratio: "4:5", width: 1024, height: 1280 },
  { ratio: "1:1", width: 1024, height: 1024 },
  { ratio: "5:4", width: 1280, height: 1024 },
  { ratio: "4:3", width: 1536, height: 1152 },
  { ratio: "3:2", width: 1536, height: 1024 },
  { ratio: "16:9", width: 2048, height: 1152 },
] as const;

export type ImageRatio = typeof IMAGE_RATIO_OPTIONS[number]["ratio"];
export type GenerationRatio = ImageRatio | "original";

export function getRatioOption(ratio: ImageRatio) {
  return IMAGE_RATIO_OPTIONS.find(option => option.ratio === ratio)
    ?? IMAGE_RATIO_OPTIONS[4];
}

export function isGenerationRatio(value: unknown): value is GenerationRatio {
  return value === "original" || IMAGE_RATIO_OPTIONS.some(option => option.ratio === value);
}
