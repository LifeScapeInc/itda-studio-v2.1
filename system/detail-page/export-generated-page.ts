import { toCanvas } from "html-to-image";

export type DetailPageExportFormat = "png" | "webp";

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map(async image => {
    if (!image.complete) {
      await new Promise<void>((resolve, reject) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => reject(new Error("내보낼 이미지를 불러오지 못했습니다.")), { once: true });
      });
    }
    if (typeof image.decode === "function") await image.decode().catch(() => undefined);
  }));
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  format: DetailPageExportFormat,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("내보내기 파일을 만들지 못했습니다.")),
      format === "png" ? "image/png" : "image/webp",
      format === "webp" ? 0.94 : undefined,
    );
  });
}

export async function exportGeneratedDetailPage(
  pageElement: HTMLElement,
  format: DetailPageExportFormat,
): Promise<void> {
  await waitForImages(pageElement);
  await document.fonts?.ready;

  const width = pageElement.offsetWidth;
  const height = pageElement.scrollHeight;
  if (!width || !height) throw new Error("내보낼 상세페이지 영역이 비어 있습니다.");

  const canvas = await toCanvas(pageElement, {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio: 1,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      boxShadow: "none",
    },
  });

  const blob = await canvasBlob(canvas, format);
  const downloadUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `itda-detail-page-${new Date().toISOString().slice(0, 10)}.${format}`;
    anchor.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }
}
