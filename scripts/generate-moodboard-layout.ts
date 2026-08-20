import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  createMoodboardLayoutManifest,
  type MoodboardColorEmbedding,
  type MoodboardLayoutSource,
} from "../system/moodboard/moodboard-layout.ts";

const IMAGE_EXTENSION = /\.(avif|jpe?g|png|webp)$/i;
const NUMBERED_IMAGE = /_(\d+)\.(avif|jpe?g|png|webp)$/i;
const SAMPLE_SIZE = 40;

type AnalysedImage = Omit<
  MoodboardLayoutSource,
  "colorDistance" | "weight"
>;

function srgbToLinear(value: number): number {
  const normalized = value / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function rgbToOklab(red: number, green: number, blue: number) {
  const linearRed = srgbToLinear(red);
  const linearGreen = srgbToLinear(green);
  const linearBlue = srgbToLinear(blue);
  const l = Math.cbrt(
    0.4122214708 * linearRed
      + 0.5363325363 * linearGreen
      + 0.0514459929 * linearBlue,
  );
  const m = Math.cbrt(
    0.2119034982 * linearRed
      + 0.6806995451 * linearGreen
      + 0.1073969566 * linearBlue,
  );
  const s = Math.cbrt(
    0.0883024619 * linearRed
      + 0.2817188376 * linearGreen
      + 0.6299787005 * linearBlue,
  );

  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    greenRed: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    blueYellow: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

async function createColorEmbedding(
  filePath: string,
): Promise<MoodboardColorEmbedding> {
  const { data, info } = await sharp(filePath)
    .rotate()
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const samples = [];

  for (let offset = 0; offset < data.length; offset += info.channels) {
    samples.push(rgbToOklab(data[offset], data[offset + 1], data[offset + 2]));
  }

  const mean = samples.reduce(
    (sum, sample) => ({
      lightness: sum.lightness + sample.lightness,
      greenRed: sum.greenRed + sample.greenRed,
      blueYellow: sum.blueYellow + sample.blueYellow,
    }),
    { lightness: 0, greenRed: 0, blueYellow: 0 },
  );
  mean.lightness /= samples.length;
  mean.greenRed /= samples.length;
  mean.blueYellow /= samples.length;

  const variance = samples.reduce(
    (sum, sample) => ({
      lightness: sum.lightness + (sample.lightness - mean.lightness) ** 2,
      chroma: sum.chroma + Math.hypot(
        sample.greenRed - mean.greenRed,
        sample.blueYellow - mean.blueYellow,
      ) ** 2,
    }),
    { lightness: 0, chroma: 0 },
  );

  return [
    mean.lightness,
    mean.greenRed,
    mean.blueYellow,
    Math.sqrt(variance.lightness / samples.length),
    Math.sqrt(variance.chroma / samples.length),
  ].map((value) => Number(value.toFixed(6))) as MoodboardColorEmbedding;
}

function getDistance(
  embedding: MoodboardColorEmbedding,
  centroid: MoodboardColorEmbedding,
): number {
  const scales = [1, 2.4, 2.4, 1.35, 1.35];

  return Math.sqrt(embedding.reduce((sum, value, index) => (
    sum + ((value - centroid[index]) * scales[index]) ** 2
  ), 0));
}

function getCentroid(images: AnalysedImage[]): MoodboardColorEmbedding {
  return [0, 1, 2, 3, 4].map((dimension) => (
    images.reduce(
      (sum, image) => sum + image.colorEmbedding[dimension],
      0,
    ) / images.length
  )) as MoodboardColorEmbedding;
}

async function readWeightOverrides(outputPath: string) {
  try {
    const previous = JSON.parse(await readFile(outputPath, "utf8")) as {
      items?: Array<{ fileName?: string; weightOverride?: number }>;
    };

    return new Map(
      previous.items
        ?.filter((item) => (
          item.fileName && typeof item.weightOverride === "number"
        ))
        .map((item) => [item.fileName as string, item.weightOverride]) ?? [],
    );
  } catch {
    return new Map<string, number>();
  }
}

async function analyseStyle(style: string, directory: string) {
  const fileNames = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => (
      entry.isFile()
      && IMAGE_EXTENSION.test(entry.name)
      && NUMBERED_IMAGE.test(entry.name)
    ))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en", { numeric: true }));
  const analysedImages = await Promise.all(fileNames.map(async (fileName) => {
    const filePath = path.join(directory, fileName);
    const metadata = await sharp(filePath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read image dimensions: ${filePath}`);
    }

    return {
      src: `/references/mood/${style}/${encodeURIComponent(fileName)}`,
      fileName,
      width: metadata.width,
      height: metadata.height,
      colorEmbedding: await createColorEmbedding(filePath),
    } satisfies AnalysedImage;
  }));

  if (analysedImages.length === 0) {
    return [];
  }

  const centroid = getCentroid(analysedImages);
  const withDistance = analysedImages
    .map((image) => ({
      ...image,
      colorDistance: getDistance(image.colorEmbedding, centroid),
    }))
    .sort((left, right) => (
      left.colorDistance - right.colorDistance
        || left.fileName.localeCompare(right.fileName, "en", { numeric: true })
    ));

  return withDistance.map((image, rank) => {
    const logarithmicWeight = withDistance.length === 1
      ? 1
      : Math.log(withDistance.length / (rank + 1))
        / Math.log(withDistance.length);

    return {
      ...image,
      colorDistance: Number(image.colorDistance.toFixed(6)),
      weight: Number((0.08 + logarithmicWeight * 0.92).toFixed(6)),
    };
  });
}

async function main() {
  const projectRoot = process.cwd();
  const sourceRoot = path.join(projectRoot, "public", "references", "mood");
  const outputRoot = path.join(projectRoot, "data", "moodboard-layouts");
  const styleEntries = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory());

  await mkdir(outputRoot, { recursive: true });

  for (const entry of styleEntries) {
    const style = entry.name;
    const outputPath = path.join(outputRoot, `${style}.json`);
    const overrides = await readWeightOverrides(outputPath);
    const sources = (await analyseStyle(style, path.join(sourceRoot, style)))
      .map((source) => {
        const weightOverride = overrides.get(source.fileName);

        return weightOverride === undefined
          ? source
          : { ...source, weightOverride };
      });
    const manifest = createMoodboardLayoutManifest(style, sources);

    await writeFile(
      outputPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    console.log(`[moodboard] ${style}: ${sources.length} images`);
  }
}

await main();
