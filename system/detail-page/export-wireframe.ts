import type { DetailTile } from "@/system/detail-page/detail-page-types";

export type WireframeFormat = "png" | "webp";

export async function exportDetailWireframe(
  tiles: DetailTile[],
  format: WireframeFormat,
): Promise<void> {
  if (typeof document === "undefined" || tiles.length === 0) return;

  await document.fonts.ready;
  const width = 900;
  const gap = 12;
  const padding = 40;
  const totalHeight = tiles.reduce(
    (sum, tile) => sum + tile.height,
    padding * 2 + gap * Math.max(0, tiles.length - 1),
  );
  const canvas = document.createElement("canvas");
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, totalHeight);
  let y = padding;

  tiles.forEach((tile, index) => {
    context.fillStyle = tile.kind === "image" ? "#efede5" : "#f5f3ed";
    context.fillRect(padding, y, width - padding * 2, tile.height);
    context.strokeStyle = "#e4e4e3";
    context.lineWidth = 1;
    context.strokeRect(padding + 0.5, y + 0.5, width - padding * 2 - 1, tile.height - 1);
    context.fillStyle = "#888379";
    context.font = "400 14px Pretendard, sans-serif";
    context.fillText(`${String(index + 1).padStart(2, "0")} · ${tile.kind === "image" ? "IMAGE" : "INFO"}`, padding + 24, y + 32);
    context.fillStyle = "#201d17";
    context.font = "600 26px Pretendard, sans-serif";
    context.fillText(tile.label, padding + 24, y + 70);
    y += tile.height + gap;
  });

  const mimeType = format === "webp" ? "image/webp" : "image/png";
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL(mimeType, 0.94);
  anchor.download = `itda-detail-wireframe.${format}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
