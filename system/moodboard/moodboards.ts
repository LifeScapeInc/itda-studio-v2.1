export type Moodboard = {
  slug: string;
  name: string;
  description: string;
  previewImages: string[];
  renderImage: string;
  renderWidth: number;
  renderHeight: number;
};

export const MOODBOARDS: Moodboard[] = [
  {
    slug: "metalic",
    name: "metalic",
    description: "차가운 금속과 모노톤이 만드는 선명한 공간",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/metalic/metalic (${index}).png`,
    ),
    renderImage: "/references/mood/metalic/metalic_render.jpg",
    renderWidth: 8000,
    renderHeight: 4500,
  },
  {
    slug: "white",
    name: "white",
    description: "부드러운 빛과 여백으로 완성한 깨끗한 공간",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/white/white (${index}).jpg`,
    ),
    renderImage: "/references/mood/white/white_render.jpg",
    renderWidth: 9180,
    renderHeight: 5163,
  },
  {
    slug: "woody",
    name: "woody",
    description: "따뜻한 목재 질감과 차분한 색감의 공간",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/woody/woody (${index}).jpg`,
    ),
    renderImage: "/references/mood/woody/woody_render.jpg",
    renderWidth: 9180,
    renderHeight: 5163,
  },
];

export function getMoodboard(slug: string): Moodboard | undefined {
  return MOODBOARDS.find((moodboard) => moodboard.slug === slug);
}
