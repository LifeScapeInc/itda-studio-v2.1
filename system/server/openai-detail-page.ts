import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { z } from "zod";
import type { DetailTile } from "@/system/detail-page/detail-page-types";
import type {
  GeneratedDetailPage,
  GeneratedMediaLayout,
  GeneratedPageImage,
  GeneratedPageTile,
  PageGenerationRequest,
  PageGenerationResponse,
} from "@/system/detail-page/page-generation-types";
import { MOCK_GENERATED_DETAIL_PAGE } from "@/system/detail-page/mock-generated-page-data";
import { runOpenAIImageEdit } from "@/system/server/openai-image";
import { IMAGE_MODEL } from "@/system/server/image-settings";
import {
  addTokenUsage,
  imageResponseTokenUsage,
  textResponseTokenUsage,
} from "@/system/usage/token-usage";

const PAGE_LAYOUT_MODEL = process.env.OPENAI_PLANNING_MODEL?.trim()
  || "gpt-5.6-terra";

const ImagePlanSchema = z.object({
  alt: z.string(),
  prompt: z.string(),
  aspectRatio: z.enum(["1:1", "3:4", "4:5", "16:9"]),
});

const TileLayoutSchema = z.object({
  sourceTileId: z.string(),
  title: z.string(),
  body: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  accentColor: z.string(),
  textAlign: z.enum(["left", "center"]),
  textPlacement: z.enum(["top", "bottom", "left", "right"]),
  textWidth: z.number().int().min(280).max(700),
  titleSize: z.number().int().min(24).max(58),
  bodySize: z.number().int().min(13).max(22),
  titleWeight: z.number().int().min(400).max(800),
  paddingTop: z.number().int().min(40).max(140),
  paddingRight: z.number().int().min(36).max(100),
  paddingBottom: z.number().int().min(40).max(140),
  paddingLeft: z.number().int().min(36).max(100),
  gap: z.number().int().min(20).max(64),
  mediaLayout: z.enum([
    "none",
    "single",
    "row",
    "column",
    "grid",
    "split-left",
    "split-right",
  ]),
  mediaWidthPercent: z.number().int().min(38).max(100),
  images: z.array(ImagePlanSchema).max(4),
});

const PageLayoutSchema = z.object({
  tiles: z.array(TileLayoutSchema).min(1).max(12),
});

type LayoutOutput = z.infer<typeof PageLayoutSchema>;
type LayoutTile = LayoutOutput["tiles"][number];
type ImagePlan = z.infer<typeof ImagePlanSchema>;

const PAGE_LAYOUT_INSTRUCTIONS = `
당신은 가구 상세페이지의 아트 디렉터이자 웹 레이아웃 설계자입니다.
가공된 의뢰 정보, 입력 제품 이미지, 사용자가 확정한 템플릿 와이어프레임을 바탕으로 각 타일의 실제 배치 명세를 작성하십시오.

핵심 원칙:
- 타일 전체를 한 장의 이미지로 만들지 않습니다. 텍스트와 개별 이미지를 HTML/CSS로 조립할 수 있는 배치 명세를 반환합니다.
- 입력 타일을 누락·추가·재정렬하지 않고 sourceTileId를 정확히 유지합니다.
- title과 body는 입력 타일의 description을 제목과 본문으로 분리합니다. 제공되지 않은 제품 사실, 수치, 인증, 소재를 추가하지 않습니다.
- 모든 타일의 고정 너비는 860px입니다. 좌우 padding과 textWidth를 고려하여 텍스트와 이미지가 타일 밖으로 벗어나지 않게 합니다.
- 텍스트는 자동 줄바꿈 가능한 고정 textWidth를 사용합니다. 제목과 본문은 충분한 대비를 확보합니다.
- 배경·텍스트·강조색은 #RRGGBB 형식으로 작성합니다.
- 정보 타일은 mediaLayout을 none으로, images를 빈 배열로 둡니다.
- 이미지 타일은 입력의 shotCount와 같은 수의 이미지 계획을 작성합니다. hero는 반드시 1장입니다.
- image prompt는 원본 제품의 형태·비례·색상·디테일을 유지하고 이미지 안에 글자·로고·워터마크를 넣지 않도록 명시합니다.
- 이미지 자체에 상세페이지 카피를 합성하지 않습니다.
- crop에 의존하는 구도를 피하고 제품 전체 또는 요청된 디테일이 생성 이미지 프레임 안에 안전 여백을 두고 완전히 들어오게 합니다.
- textPlacement가 left/right이면 mediaLayout은 split-left 또는 split-right를 사용합니다.
- 이미지 2장은 row 또는 grid, 3~4장은 grid 또는 column을 우선 사용합니다.
- 타일 높이는 반환하지 않습니다. 콘텐츠 양과 이미지 비율에 따라 브라우저에서 자연스럽게 결정됩니다.
`.trim();

function color(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : fallback;
}

function splitCopy(description: string): { title: string; body: string } {
  const lines = description.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return {
    title: lines[0] ?? "상세 정보",
    body: lines.slice(1).join("\n") || lines[0] || "",
  };
}

function fallbackLayout(tile: DetailTile): LayoutTile {
  const copy = splitCopy(tile.description);
  const count = tile.kind === "image"
    ? tile.type === "hero" ? 1 : Math.max(1, Math.min(4, tile.shotCount ?? 1))
    : 0;
  const images: ImagePlan[] = Array.from({ length: count }, (_, index) => ({
    alt: `${tile.label} 이미지 ${index + 1}`,
    prompt: `${tile.imageLayout || tile.prompt || tile.description}\n원본 제품의 형태, 비례, 색상과 디테일을 정확히 유지한다. 프레임 안에 피사체가 잘리지 않도록 안전 여백을 둔다. 이미지 안에 텍스트, 로고, 워터마크를 넣지 않는다.`,
    aspectRatio: tile.type === "hero" ? "16:9" as const : "4:5" as const,
  }));
  return {
    sourceTileId: tile.id,
    title: copy.title,
    body: copy.body,
    backgroundColor: tile.kind === "image" ? "#F2EEE7" : "#FFFFFF",
    textColor: "#24211D",
    accentColor: "#936F45",
    textAlign: tile.type === "hero" ? "center" : "left",
    textPlacement: tile.type === "hero" ? "top" : "left",
    textWidth: tile.type === "hero" ? 620 : 440,
    titleSize: tile.type === "hero" ? 46 : 32,
    bodySize: 16,
    titleWeight: 700,
    paddingTop: tile.type === "hero" ? 88 : 64,
    paddingRight: 64,
    paddingBottom: tile.type === "hero" ? 72 : 64,
    paddingLeft: 64,
    gap: 36,
    mediaLayout: count === 0
      ? "none"
      : count === 1
        ? "single"
        : count === 2
          ? "row"
          : "grid",
    mediaWidthPercent: count === 0 ? 100 : tile.type === "hero" ? 100 : 56,
    images,
  };
}

function normalizeLayout(layout: LayoutOutput, tiles: DetailTile[]): LayoutTile[] {
  return tiles.map(tile => {
    const generated = layout.tiles.find(item => item.sourceTileId === tile.id);
    const fallback = fallbackLayout(tile);
    if (!generated) return fallback;
    const count = tile.kind === "image"
      ? tile.type === "hero" ? 1 : Math.max(1, Math.min(4, tile.shotCount ?? 1))
      : 0;
    const images = Array.from({ length: count }, (_, index) => (
      generated.images[index] ?? fallback.images[index]
    ));
    return {
      ...generated,
      sourceTileId: tile.id,
      backgroundColor: color(generated.backgroundColor, fallback.backgroundColor),
      textColor: color(generated.textColor, fallback.textColor),
      accentColor: color(generated.accentColor, fallback.accentColor),
      mediaLayout: count ? generated.mediaLayout : "none",
      images,
    };
  });
}

function toGeneratedTile(
  tile: DetailTile,
  layout: LayoutTile,
  images: GeneratedPageImage[],
): GeneratedPageTile {
  return {
    id: `generated-${tile.id}`,
    sourceTileId: tile.id,
    type: tile.type,
    title: layout.title,
    body: layout.body,
    backgroundColor: layout.backgroundColor,
    textColor: layout.textColor,
    accentColor: layout.accentColor,
    textAlign: layout.textAlign,
    textPlacement: layout.textPlacement,
    textWidth: layout.textWidth,
    titleSize: layout.titleSize,
    bodySize: layout.bodySize,
    titleWeight: layout.titleWeight,
    paddingTop: layout.paddingTop,
    paddingRight: layout.paddingRight,
    paddingBottom: layout.paddingBottom,
    paddingLeft: layout.paddingLeft,
    gap: layout.gap,
    mediaLayout: layout.mediaLayout as GeneratedMediaLayout,
    mediaWidthPercent: layout.mediaWidthPercent,
    images,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export function createMockDetailPage(): PageGenerationResponse {
  return {
    mock: true,
    page: MOCK_GENERATED_DETAIL_PAGE,
    note: "목업 상세페이지를 생성했습니다.",
    metadata: { layoutModel: "debug-preview", imageModel: "debug-preview" },
  };
}

export async function runOpenAIDetailPage({
  apiKey,
  request,
}: {
  apiKey: string;
  request: PageGenerationRequest;
}): Promise<PageGenerationResponse> {
  if (!request.furnitureImage?.startsWith("data:image/")) {
    throw new Error("대상 가구 이미지가 필요합니다.");
  }
  const content: ResponseInputContent[] = [
    {
      type: "input_text",
      text: `가공된 의뢰 정보:\n${JSON.stringify(request.planningInput, null, 2)}\n\n확정된 템플릿 와이어프레임:\n${JSON.stringify(request.tiles, null, 2)}`,
    },
    {
      type: "input_image",
      detail: "high",
      image_url: request.furnitureImage,
    },
  ];
  const client = new OpenAI({ apiKey, maxRetries: 3 });
  const response = await client.responses.parse({
    model: PAGE_LAYOUT_MODEL,
    instructions: PAGE_LAYOUT_INSTRUCTIONS,
    input: [{ role: "user", content }],
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(PageLayoutSchema, "generated_detail_page_layout"),
      verbosity: "medium",
    },
  });
  if (!response.output_parsed) {
    throw new Error("GPT가 상세페이지 배치 구조를 완성하지 못했습니다.");
  }
  const layouts = normalizeLayout(response.output_parsed, request.tiles);
  const jobs = layouts.flatMap((layout, tileIndex) => layout.images.map((image, imageIndex) => ({
    layout,
    image,
    tile: request.tiles[tileIndex],
    tileIndex,
    imageIndex,
  })));
  const generatedImages = await mapWithConcurrency(jobs, 2, async job => {
    const result = await runOpenAIImageEdit({
      productImage: request.furnitureImage!,
      prompt: `${job.image.prompt}\n이 이미지는 ${job.tile.label} 타일의 ${job.imageIndex + 1}번째 독립 이미지다. 원본 제품의 정체성을 유지하고 상세페이지 카피나 글자를 이미지 내부에 넣지 않는다.`,
      quality: "medium",
      ratio: job.image.aspectRatio,
    }, apiKey);
    return {
      tileIndex: job.tileIndex,
      tokenUsage: imageResponseTokenUsage(result.usage),
      image: {
        id: `${job.tile.id}-image-${job.imageIndex + 1}`,
        url: result.images[0],
        alt: job.image.alt,
        aspectRatio: job.image.aspectRatio,
      } satisfies GeneratedPageImage,
    };
  });
  const imagesByTile = new Map<number, GeneratedPageImage[]>();
  for (const generated of generatedImages) {
    const images = imagesByTile.get(generated.tileIndex) ?? [];
    images.push(generated.image);
    imagesByTile.set(generated.tileIndex, images);
  }
  const tiles = request.tiles.map((tile, index) => (
    toGeneratedTile(tile, layouts[index], imagesByTile.get(index) ?? [])
  ));
  const page: GeneratedDetailPage = { width: 860, tiles };
  return {
    mock: false,
    page,
    note: `${PAGE_LAYOUT_MODEL}와 ${IMAGE_MODEL}로 상세페이지를 생성했습니다.`,
    metadata: { layoutModel: PAGE_LAYOUT_MODEL, imageModel: IMAGE_MODEL },
    tokenUsage: addTokenUsage(
      textResponseTokenUsage(response.usage),
      ...generatedImages.map(generated => generated.tokenUsage),
    ),
  };
}
