import OpenAI from "openai";
import { OPENAI_API_BASE_URL } from "@/system/server/app-settings";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { z } from "zod";
import {
  DETAIL_TILE_DEFINITIONS,
  type PlanningCandidate,
  type TemplateStructureResponse,
  type TemplateStructureTile,
} from "@/system/detail-page/detail-page-types";

const TEMPLATE_MODEL = process.env.OPENAI_PLANNING_MODEL?.trim()
  || "gpt-5.6-terra";

const TILE_TYPES = [
  "hero",
  "overview",
  "closeup",
  "material",
  "size",
  "features",
  "styling",
  "delivery",
  "notice",
] as const;

const TemplateStructureSchema = z.object({
  tiles: z.array(z.object({
    type: z.enum(TILE_TYPES),
    content: z.string(),
    imageLayout: z.string(),
    imageCount: z.number().int().min(0).max(4),
  })).min(5).max(9),
});

const TEMPLATE_STRUCTURE_INSTRUCTIONS = `
당신은 가구 상세페이지의 콘텐츠 구조와 이미지 레이아웃을 설계하는 시니어 콘텐츠 디렉터입니다.
선택된 기획안과 제품 이미지를 바탕으로 실제 제작에 사용할 상세페이지 템플릿 구조를 작성하십시오.

사용 가능한 타일:
- hero: 첫 화면의 대표 이미지와 핵심 메시지
- overview: 제품과 기획 방향을 소개하는 정보 영역
- closeup: 마감과 구조 디테일을 보여주는 이미지 영역
- material: 소재의 색감과 질감을 보여주는 이미지 영역
- size: 치수와 공간 점유 정보를 설명하는 정보 영역
- features: 기능과 사용상 장점을 설명하는 정보 영역
- styling: 실제 공간에서의 사용 장면을 보여주는 이미지 영역
- delivery: 배송과 설치 절차를 안내하는 정보 영역
- notice: 구매 전 확인할 관리·교환·주의사항 영역

작성 원칙:
- 위 목록에 존재하는 타일만 선택하고, 상세페이지의 실제 전개 순서대로 반환합니다.
- 같은 타일 타입을 중복해서 사용하지 않습니다.
- hero는 항상 첫 번째이며 이미지 1장만 사용합니다.
- 정보 타일의 imageCount는 0, imageLayout은 빈 문자열로 작성합니다.
- hero 외 이미지 타일은 1~4장의 이미지를 사용합니다.
- content에는 해당 타일의 수정 가능한 텍스트 박스에 들어갈 실제 기획 내용을 작성합니다.
- 이미지 타일의 content에는 이미지가 전달해야 할 메시지와 장면의 목적을 작성합니다.
- 이미지 타일의 imageLayout에는 각 이미지가 무엇을 보여주는지, 어느 위치에 놓이는지, 상대적인 크기와 비율, 정렬, 여백, 겹침 여부를 제작자가 바로 이해할 수 있을 정도로 상세하게 작성합니다.
- 제품 이미지에서 확인할 수 없는 소재 등급, 수치, 인증, 기능을 만들어내지 않습니다.
- 선택된 기획안의 포지셔닝 축, 타겟, 슬로건, 키워드와 톤앤매너가 전개 전체에 일관되게 반영되어야 합니다.
`.trim();

function normalizeTiles(
  tiles: TemplateStructureTile[],
  plan: PlanningCandidate,
): TemplateStructureTile[] {
  const uniqueTiles = tiles.filter((tile, index, allTiles) => (
    allTiles.findIndex(candidate => candidate.type === tile.type) === index
  ));
  const generatedHero = uniqueTiles.find(tile => tile.type === "hero");
  const hero: TemplateStructureTile = generatedHero ? {
    ...generatedHero,
    imageCount: 1,
  } : {
    type: "hero",
    content: `${plan.concept}\n${plan.coreSlogan}`,
    imageLayout: "제품 대표 이미지를 화면 중심에 크게 배치하고, 핵심 슬로건이 제품 실루엣을 가리지 않는 여백 영역에 놓이도록 구성합니다.",
    imageCount: 1,
  };

  return [
    hero,
    ...uniqueTiles
      .filter(tile => tile.type !== "hero")
      .map(tile => {
        const definition = DETAIL_TILE_DEFINITIONS.find(item => item.type === tile.type);
        if (definition?.kind !== "image") {
          return { ...tile, imageLayout: "", imageCount: 0 };
        }
        return {
          ...tile,
          imageCount: Math.max(1, Math.min(4, tile.imageCount || 1)),
        };
      }),
  ];
}

export async function runOpenAITemplateStructure({
  apiKey,
  furnitureImage,
  plan,
}: {
  apiKey: string;
  furnitureImage: string;
  plan: PlanningCandidate;
}): Promise<TemplateStructureResponse> {
  const content: ResponseInputContent[] = [
    {
      type: "input_text",
      text: `다음 기획안을 상세페이지 템플릿 구조로 발전시켜 주세요.\n\n${JSON.stringify(plan, null, 2)}`,
    },
    {
      type: "input_image",
      detail: "high",
      image_url: furnitureImage,
    },
  ];
  const client = new OpenAI({
    apiKey,
    baseURL: OPENAI_API_BASE_URL,
    maxRetries: 3,
  });
  const response = await client.responses.parse({
    model: TEMPLATE_MODEL,
    instructions: TEMPLATE_STRUCTURE_INSTRUCTIONS,
    input: [{ role: "user", content }],
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(TemplateStructureSchema, "detail_page_template_structure"),
      verbosity: "medium",
    },
  });
  const output = response.output_parsed;
  if (!output) {
    throw new Error("GPT가 템플릿 구조를 완성하지 못했습니다.");
  }

  return {
    mock: false,
    tiles: normalizeTiles(output.tiles, plan),
    note: `${TEMPLATE_MODEL}로 템플릿 구조를 생성했습니다.`,
    metadata: { model: TEMPLATE_MODEL },
  };
}
