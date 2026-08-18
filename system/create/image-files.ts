export type ReferencePreset = {
  id: string;
  label: string;
  src: string;
};

export const REFERENCE_PRESETS: ReferencePreset[] = [
  {
    id: "metalic-1",
    label: "메탈릭 스튜디오",
    src: "/references/mood/metalic/metalic_1.png",
  },
  {
    id: "metalic-3",
    label: "모노톤 라운지",
    src: "/references/mood/metalic/metalic_3.png",
  },
  {
    id: "white-1",
    label: "화이트 거실",
    src: "/references/mood/white/white_1.jpg",
  },
  {
    id: "white-3",
    label: "소프트 뉴트럴",
    src: "/references/mood/white/white_3.jpg",
  },
  {
    id: "woody-1",
    label: "우디 클래식",
    src: "/references/mood/woody/woody_1.jpg",
  },
  {
    id: "woody-3",
    label: "웜 우드",
    src: "/references/mood/woody/woody_3.jpg",
  },
];

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
