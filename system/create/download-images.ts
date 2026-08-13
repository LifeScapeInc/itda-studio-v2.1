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

export function downloadGenerationSet(
  shots: LibraryGenerationShot[],
  prefix: string,
): void {
  shots
    .filter((shot) => shot.status === "done" && shot.imageUrl)
    .forEach((shot, index) => {
      downloadGenerationImage(shot, `${prefix}-${index + 1}`);
    });
}
