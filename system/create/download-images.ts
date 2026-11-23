import type { LibraryGenerationShot } from "@/system/create/generation-library";

function safeFileName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function downloadGenerationImage(
  shot: LibraryGenerationShot,
  prefix = "itda",
): void {
  if (!shot.imageUrl) return;

  const anchor = document.createElement("a");
  anchor.href = shot.imageUrl;
  anchor.download = `${safeFileName(prefix)}-${safeFileName(shot.label)}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadGenerationSet(
  shots: LibraryGenerationShot[],
  prefix: string,
): Promise<void> {
  const downloadable = shots.filter(shot => shot.status === "done" && shot.imageUrl);
  if (!downloadable.length) return;
  if (downloadable.length === 1) { downloadGenerationImage(downloadable[0], prefix); return; }

  const { zipSync } = await import("fflate");
  const files: Record<string, Uint8Array> = {};
  // Load sequentially to avoid simultaneous decoding of many large data URLs.
  for (const [index, shot] of downloadable.entries()) {
    const response = await fetch(shot.imageUrl!);
    if (!response.ok) throw new Error(`‘${shot.label}’ 이미지를 불러오지 못했습니다. 다시 시도해 주세요.`);
    const blob = await response.blob();
    const extension = ({ "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[blob.type] ?? "png";
    files[`${String(index + 1).padStart(2, "0")}_${safeFileName(shot.label) || "image"}.${extension}`] = new Uint8Array(await blob.arrayBuffer());
  }
  // Images are already compressed; ZIP STORE avoids recompressing them on the UI thread.
  const archive = zipSync(files, { level: 0 });
  const url = URL.createObjectURL(new Blob([new Uint8Array(archive)], { type: "application/zip" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(prefix) || "itda-images"}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
