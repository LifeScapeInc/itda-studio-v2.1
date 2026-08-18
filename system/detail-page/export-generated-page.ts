export type DetailPageExportFormat = "png" | "webp";

function copyComputedStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);
  const targetElement = target as HTMLElement;
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    targetElement.style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property),
    );
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStyles(child, targetChild);
  });
}

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

async function svgImage(svg: string): Promise<{
  image: HTMLImageElement;
  release: () => void;
}> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("상세페이지를 이미지로 변환하지 못했습니다.")), { once: true });
    });
    return {
      image,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
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

  const clone = pageElement.cloneNode(true) as HTMLElement;
  copyComputedStyles(pageElement, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<foreignObject width="100%" height="100%">${markup}</foreignObject>`,
    "</svg>",
  ].join("");
  const { image, release } = await svgImage(svg);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("내보내기 캔버스를 만들지 못했습니다.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  try {
    context.drawImage(image, 0, 0, width, height);
  } finally {
    release();
  }

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
