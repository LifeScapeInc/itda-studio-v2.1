import { readFile } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import type { GenerationApiRequest } from "@/system/create/generation-api";
import {
  getOpenAIApiKey,
  OPENAI_API_BASE_URL,
} from "@/system/server/app-settings";
import {
  IMAGE_MODEL,
  mapQuality,
  mapSize,
} from "@/system/server/image-settings";

const OPENAI_MAX_RETRIES = 0;
const OPENAI_TIMEOUT_MS = 52_000;
const MAX_RESPONSE_IMAGE_BYTES = 3_500_000;

function parseDataUrl(
  source: string,
): {
  buffer: Buffer;
  mimeType: string;
} | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(source);
  if (!match) {
    return null;
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mimeType: match[1],
  };
}

function resolvePublicPath(source: string): string {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(source.split(/[?#]/)[0]);
  } catch {
    throw new Error("레퍼런스 이미지 경로가 올바르지 않습니다.");
  }

  const normalized = decodedPath.replace(/^\/+/, "");
  const publicDirectory = path.resolve(process.cwd(), "public");
  const filePath = path.resolve(publicDirectory, normalized);

  if (
    filePath !== publicDirectory
    && !filePath.startsWith(`${publicDirectory}${path.sep}`)
  ) {
    throw new Error("허용되지 않은 이미지 경로입니다.");
  }

  return filePath;
}

async function resolveImage(
  source: string,
  name: string,
): Promise<Awaited<ReturnType<typeof toFile>>> {
  const parsed = parseDataUrl(source);
  if (parsed) {
    return normalizeImage(parsed.buffer, name);
  }

  if (!source.startsWith("/")) {
    throw new Error("이미지는 업로드 데이터 또는 public 경로여야 합니다.");
  }

  const filePath = resolvePublicPath(source);
  return normalizeImage(await readFile(filePath), name);
}

async function normalizeImage(
  buffer: Buffer,
  name: string,
): Promise<Awaited<ReturnType<typeof toFile>>> {
  try {
    const normalized = await sharp(buffer, { animated: false })
      .rotate()
      .toColourspace("srgb")
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();

    return toFile(normalized, `${name}.png`, {
      type: "image/png",
    });
  } catch {
    throw new Error(
      "이미지 파일을 읽지 못했습니다. PNG, JPG 또는 WebP 파일로 다시 업로드해 주세요.",
    );
  }
}

export type OpenAIImageResult = {
  images: string[];
  usage?: Record<string, unknown>;
  quality: string;
  size: string;
};

async function optimizeGeneratedImage(base64Image: string): Promise<string> {
  const source = Buffer.from(base64Image, "base64");
  const attempts = [
    { dimension: 2048, quality: 86 },
    { dimension: 1792, quality: 80 },
    { dimension: 1536, quality: 74 },
    { dimension: 1280, quality: 70 },
  ];

  for (const [index, options] of attempts.entries()) {
    const optimized = await sharp(source, { animated: false })
      .rotate()
      .resize({
        width: options.dimension,
        height: options.dimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: options.quality, effort: 4 })
      .toBuffer();

    if (optimized.length <= MAX_RESPONSE_IMAGE_BYTES || index === attempts.length - 1) {
      return `data:image/webp;base64,${optimized.toString("base64")}`;
    }
  }

  throw new Error("생성 이미지를 전송 가능한 크기로 압축하지 못했습니다.");
}

export async function runOpenAIImageEdit(
  request: GenerationApiRequest,
  providedApiKey?: string,
): Promise<OpenAIImageResult> {
  const apiKey = providedApiKey?.trim() || await getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API 키가 연결되지 않았습니다.");
  }

  const imageFiles = [await resolveImage(request.productImage, "product")];
  const references = (request.referenceImages ?? []).slice(0, 15);

  for (let index = 0; index < references.length; index += 1) {
    imageFiles.push(await resolveImage(references[index], `reference-${index + 1}`));
  }

  const quality = mapQuality(request.quality);
  const size = mapSize(request.ratio);
  const client = new OpenAI({
    apiKey,
    baseURL: OPENAI_API_BASE_URL,
    maxRetries: OPENAI_MAX_RETRIES,
    timeout: OPENAI_TIMEOUT_MS,
  });
  const response = await client.images.edit({
    model: IMAGE_MODEL,
    image: imageFiles,
    prompt: request.prompt,
    quality,
    size,
    n: 1,
  });
  const encodedImages = (response.data ?? [])
    .map((image) => image.b64_json)
    .filter((image): image is string => Boolean(image));

  const images = await Promise.all(encodedImages.map(optimizeGeneratedImage));

  if (images.length === 0) {
    throw new Error("OpenAI에서 생성 이미지를 반환하지 않았습니다.");
  }

  const metadata = response as unknown as Record<string, unknown>;
  const usage = metadata.usage;

  return {
    images,
    usage: usage && typeof usage === "object"
      ? usage as Record<string, unknown>
      : undefined,
    quality,
    size,
  };
}
