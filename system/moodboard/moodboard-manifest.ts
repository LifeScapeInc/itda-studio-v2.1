import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { MoodboardLayoutManifest } from "@/system/moodboard/moodboard-layout";

const colorEmbeddingSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const manifestSchema = z.object({
  version: z.literal(1),
  style: z.string(),
  generatedAt: z.string(),
  seed: z.number(),
  canvas: z.object({
    width: z.literal(1600),
    height: z.literal(900),
    gap: z.literal(8),
  }),
  items: z.array(z.object({
    src: z.string(),
    fileName: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    colorEmbedding: colorEmbeddingSchema,
    colorDistance: z.number().nonnegative(),
    weight: z.number().min(0).max(1),
    weightOverride: z.number().min(0).max(1).optional(),
    rect: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().positive().max(1),
      height: z.number().positive().max(1),
    }),
  })),
});

export function getMoodboardLayoutManifest(
  style: string,
): MoodboardLayoutManifest | null {
  const manifestPath = path.join(
    process.cwd(),
    "data",
    "moodboard-layouts",
    `${style}.json`,
  );

  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest = manifestSchema.parse(
      JSON.parse(readFileSync(manifestPath, "utf8")),
    );

    return manifest.style === style
      ? manifest as MoodboardLayoutManifest
      : null;
  } catch (error) {
    console.error(`[moodboard] Invalid layout manifest: ${style}`, error);

    return null;
  }
}
