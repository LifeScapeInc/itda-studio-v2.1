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

const MAX_UPLOAD_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 1_500_000;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob
        ? resolve(blob)
        : reject(new Error("이미지를 압축하지 못했습니다.")),
      "image/webp",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function optimizeImageBlob(source: Blob): Promise<string> {
  const bitmap = await createImageBitmap(source);

  try {
    const initialScale = Math.min(
      1,
      MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));
    let quality = 0.86;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("이미지를 처리할 수 없습니다.");
      }
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= MAX_UPLOAD_BYTES || attempt === 4) {
        return blobToDataUrl(blob);
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
      quality = Math.max(0.68, quality - 0.06);
    }

    throw new Error("이미지 용량을 줄이지 못했습니다.");
  } finally {
    bitmap.close();
  }
}

export function readImageFile(file: File): Promise<string> {
  return optimizeImageBlob(file);
}

export async function optimizeImageDataUrl(source: string): Promise<string> {
  if (!source.startsWith("data:image/") || source.length <= 2_000_000) {
    return source;
  }

  const response = await fetch(source);
  return optimizeImageBlob(await response.blob());
}
