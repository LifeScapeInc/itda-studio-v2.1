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
    description: "실버, 블랙, 그레이 톤을 중심으로 구조감과 오브제성을 강조하는 메탈무드",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/metalic/metalic_${index}.png`,
    ),
    renderImage: "/references/mood/metalic/metalic_render.png",
    renderWidth: 8000,
    renderHeight: 4500,
  },
  {
    slug: "white",
    name: "white",
    description: "깔끔한 하얀 배경과 자연광을 활용",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/white/white_${index}.jpg`,
    ),
    renderImage: "/references/mood/white/white_render.png",
    renderWidth: 9180,
    renderHeight: 5163,
  },
  {
    slug: "woody",
    name: "woody",
    description: "우드/원목 등 웜톤 가구에 쓸 수 있는 안정감을 강조하는 무드",
    previewImages: [1, 2, 3].map(
      (index) => `/references/mood/woody/woody_${index}.jpg`,
    ),
    renderImage: "/references/mood/woody/woody_render.png",
    renderWidth: 9180,
    renderHeight: 5163,
  },
];

export function getMoodboard(slug: string): Moodboard | undefined {
  return MOODBOARDS.find((moodboard) => moodboard.slug === slug);
}
