import "server-only";

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const IMAGE_EXTENSION = /\.(avif|jpe?g|png|webp)$/i;
const collator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base",
});

export function getMoodboardDetailImages(style: string): string[] {
  const directory = path.join(
    process.cwd(),
    "public",
    "references",
    "mood",
    style,
  );

  if (!existsSync(directory)) {
    return [];
  }

  const escapedStyle = style.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const numberedImage = new RegExp(
    `^${escapedStyle}_\\d+${IMAGE_EXTENSION.source}`,
    "i",
  );

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && numberedImage.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => collator.compare(left, right))
    .map(
      (fileName) => (
        `/references/mood/${style}/${encodeURIComponent(fileName)}`
      ),
    );
}
