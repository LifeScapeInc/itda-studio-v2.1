export type Moodboard = {
  slug: string;
  name: string;
  description: string;
  previewImages: string[];
};

function previewImages(slug: string): string[] {
  return [1, 2, 3].map(
    (index) => `/references/mood/${slug}/${slug}_${index}.png`,
  );
}

// moodboard //
export const MOODBOARDS: Moodboard[] = [
  {
    slug: "black",
    name: "black",
    description: "블랙을 중심으로 깊은 대비와 절제된 구조감",
    previewImages: previewImages("black"),
  },
  {
    slug: "colorful",
    name: "colorful",
    description: "선명한 색채와 경쾌한 조합으로 개성 있는 공간",
    previewImages: previewImages("colorful"),
  },
  {
    slug: "industrial",
    name: "industrial",
    description: "노출된 구조와 거친 소재의 질감",
    previewImages: previewImages("industrial"),
  },
  {
    slug: "metallic",
    name: "metallic",
    description: "실버와 메탈 소재의 반사감, 정제된 오브제",
    previewImages: previewImages("metallic"),
  },
  {
    slug: "natural",
    name: "natural",
    description: "자연 소재와 부드러운 중성 톤으로 만드는 편안함",
    previewImages: previewImages("natural"),
  },
  {
    slug: "white",
    name: "white",
    description: "밝은 화이트 톤과 자연광으로 깨끗하고 여유로운 인상",
    previewImages: previewImages("white"),
  },
  {
    slug: "woodydark",
    name: "woody dark",
    description: "짙은 목재와 깊은 웜톤으로 차분하고 묵직한 안정감",
    previewImages: previewImages("woodydark"),
  },
  {
    slug: "woodylight",
    name: "woody light",
    description: "밝은 원목과 부드러운 웜톤으로 가볍고 편안한 인상",
    previewImages: previewImages("woodylight"),
  },
];

export function getMoodboard(slug: string): Moodboard | undefined {
  return MOODBOARDS.find((moodboard) => moodboard.slug === slug);
}
