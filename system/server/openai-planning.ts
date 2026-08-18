import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { z } from "zod";
import type {
  DetailTileType,
  PlanningGenerationResponse,
} from "@/system/detail-page/detail-page-types";

const PLANNING_MODEL = process.env.OPENAI_PLANNING_MODEL?.trim()
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
] as const satisfies readonly DetailTileType[];

const PlanningInputSchema = z.object({
  keepExistingBrandTone: z.string(),
  basicInfo: z.object({
    productName: z.string(),
    price: z.string(),
    discountPrice: z.string(),
    manufacturer: z.string(),
  }),
  productInfo: z.object({
    externalDimensions: z.array(z.string()),
    internalDimensions: z.array(z.string()),
    colorOptions: z.array(z.string()),
    weightAndLoadCapacity: z.array(z.string()),
  }),
  materialInfo: z.array(z.object({
    material: z.string(),
    materialGrade: z.string(),
    countryOfOrigin: z.string(),
  })),
  content: z.object({
    storyFlow: z.string(),
    copywriting: z.string(),
    coreSellingPoints: z.array(z.string()),
    excludedItems: z.string(),
    precautions: z.string(),
  }),
  trustElements: z.object({
    afterSalesServicePeriod: z.string(),
    qualityWarranty: z.string(),
    certifications: z.string(),
  }),
  references: z.array(z.object({
    address: z.string(),
    referencePoint: z.string(),
  })),
  installation: z.object({
    assemblyRequired: z.string(),
    installationRequired: z.string(),
    components: z.array(z.string()),
  }),
  delivery: z.object({
    deliveryMethod: z.string(),
    parcelOrFreight: z.string(),
    shippingCostByOption: z.string(),
  }),
  otherRequests: z.object({
    realPersonPhotos: z.string(),
    gif: z.string(),
    other: z.string(),
  }),
});

const InputProcessingOutputSchema = z.object({
  sourceSummary: z.string(),
  input: PlanningInputSchema,
});

const PlanningOutputSchema = z.object({
  candidates: z.array(z.object({
    axisName: z.string(),
    title: z.string(),
    concept: z.string(),
    description: z.string(),
    targetCustomer: z.string(),
    coreSlogan: z.string(),
    keywords: z.array(z.string()).min(2).max(4),
    toneAndManner: z.object({
      visual: z.string(),
      photo: z.string(),
      copy: z.string(),
      typography: z.string(),
      layout: z.string(),
    }),
    naming: z.object({
      workingTitle: z.string(),
      principles: z.array(z.string()),
    }),
    notes: z.object({
      exclusionCheck: z.string(),
      otherUnreflected: z.array(z.string()),
      emptyControlFieldNotice: z.string(),
    }),
    tileTypes: z.array(z.enum(TILE_TYPES)).min(5).max(9),
  })).min(2).max(3),
});

const INPUT_PROCESSING_INSTRUCTIONS = `
당신은 고객의 가구 상세페이지 제작 의뢰 자료를 정해진 입력 스키마로 옮기는 분석 담당자입니다.
첨부된 의뢰 요청서와 제품 이미지를 하나의 제작 의뢰로 보고 정보를 구조화하십시오.

작업 원칙:
- 이 단계는 전사와 정리 단계이며 기획, 카피 작성, 전략 제안을 하지 않습니다.
- 요청서에 명시되지 않은 값은 빈 문자열 또는 빈 배열로 둡니다.
- 원문의 표현과 의미를 최대한 보존하고 서로 다른 필드의 내용을 섞지 않습니다.
- 제품 이미지는 제품 식별과 명확히 보이는 외형·색상 확인에만 사용합니다. 이미지로 확정할 수 없는 소재, 등급, 원산지, 치수, 성능을 추정하지 않습니다.
- 브랜드 정보의 이름, 주색상, 톤앤매너는 이번 입력 스키마에서 의도적으로 제외되었으므로 별도 필드나 다른 필드에 옮기지 않습니다.
- 인증, 특허, 수상, 품질 등급처럼 검증 가능한 사실을 만들어내지 않습니다.
- references에는 의뢰 요청서에 실제로 적힌 주소와 참고 포인트만 옮깁니다. 외부 페이지에 접속하거나 새 레퍼런스를 추천하지 않습니다.
- 스키마 밖이지만 원문에 존재하는 요청은 otherRequests.other에 보존합니다.
- sourceSummary는 확인된 입력의 핵심만 한 문장으로 요약합니다.
`.trim();

const PROPOSAL_GENERATION_INSTRUCTIONS = `
당신은 가구 상세페이지 제작사의 시니어 브랜드 기획자입니다.
구조화된 의뢰 정보와 원본 제품 이미지를 바탕으로, 고객과 상세페이지 방향을 합의하기 위한 기획안 후보 2~3개를 작성하십시오.

작업 원칙:
- 구조화된 의뢰 정보는 고객이 제공한 사실의 기준입니다.
- 제품 이미지는 형태, 비례, 색감, 시각적 인상을 파악하는 보조 근거로 사용합니다.
- 이미지로 확정할 수 없는 소재 등급, 원산지, 치수, 성능, 인증을 만들어내지 않습니다.
- 후보들은 표현만 바꾸지 말고 서로 다른 구매동기와 서사 프레임을 대표해야 합니다.
- 시장/경쟁사의 일반적 화법, 비교 주장, 시장 조사 결과를 생성하지 않습니다.
- 외부 레퍼런스를 조사하거나 새로운 브랜드와 사례를 추천하지 않습니다.
- 상세페이지 제외 항목은 모든 후보에 대한 하드 제약입니다.
- 입력에 상품명이 있으면 새 네이밍을 제안하지 않습니다. 네이밍 요청이 명시된 경우에만 가칭과 원칙을 작성합니다.
- 각 후보의 tileTypes는 해당 서사에 필요한 상세페이지 섹션을 흐름 순서대로 선택합니다. hero는 항상 첫 번째로 둡니다.
- 결과는 간결한 한국어 기획 문구로 작성합니다.

필드 기준:
- axisName: 10자 이내 포지셔닝 축
- title: 고객이 후보를 구분하기 쉬운 기획안 이름
- concept: 짧은 기획 방향 라벨
- description: 후보의 이야기 전개와 차별점을 2문장 이내로 설명
- targetCustomer: 이 후보가 가정하는 구매자상
- coreSlogan: 하나의 대표 문구
- keywords: 후보의 핵심 키워드 2~4개
- toneAndManner: 비주얼, 사진, 카피, 서체, 레이아웃의 실행 방향
- naming: 의뢰서에 상품명이 있으면 가칭과 원칙을 비우고, 네이밍 요청이 있을 때만 제안
- notes.exclusionCheck: 제외 항목 위반 여부를 짧게 점검
- notes.otherUnreflected: 의뢰서에 있었지만 후보에서 의도적으로 반영하지 않은 정보만 기록
- notes.emptyControlFieldNotice: 기존 브랜드 톤 유지 여부 등 제어 필드가 비어 있을 때만 짧게 기록
`.trim();

function mimeTypeFor(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
  };
  return mimeTypes[extension ?? ""] ?? "application/octet-stream";
}

export async function runOpenAIPlanning({
  apiKey,
  furnitureImage,
  requestDocument,
  onProgress,
}: {
  apiKey: string;
  furnitureImage: string;
  requestDocument: File;
  onProgress?: (stage: "input" | "proposal") => void;
}): Promise<PlanningGenerationResponse> {
  const requestBuffer = Buffer.from(await requestDocument.arrayBuffer());
  const requestMimeType = mimeTypeFor(requestDocument);
  const sourceContent: ResponseInputContent[] = [
    {
      type: "input_file",
      filename: requestDocument.name,
      file_data: `data:${requestMimeType};base64,${requestBuffer.toString("base64")}`,
      detail: "low",
    },
  ];

  if (furnitureImage.startsWith("data:image/")) {
    sourceContent.push({
      type: "input_image",
      detail: "high",
      image_url: furnitureImage,
    });
  }

  sourceContent.push({
    type: "input_text",
    text: "첨부 자료를 분석하여 고객이 제공한 정보를 입력 스키마에 맞게 구조화해 주세요.",
  });

  const client = new OpenAI({ apiKey, maxRetries: 3 });
  onProgress?.("input");
  const inputResponse = await client.responses.parse({
    model: PLANNING_MODEL,
    instructions: INPUT_PROCESSING_INSTRUCTIONS,
    input: [{ role: "user", content: sourceContent }],
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(InputProcessingOutputSchema, "detail_page_input"),
      verbosity: "medium",
    },
  });

  const processed = inputResponse.output_parsed;
  if (!processed) {
    throw new Error("GPT가 의뢰 정보를 구조화하지 못했습니다.");
  }

  const proposalContent: ResponseInputContent[] = [
    {
      type: "input_text",
      text: `다음은 1단계에서 가공한 의뢰 정보입니다. 이 정보와 제품 이미지를 바탕으로 기획안 후보를 작성해 주세요.\n\n${JSON.stringify(processed.input, null, 2)}`,
    },
  ];
  if (furnitureImage.startsWith("data:image/")) {
    proposalContent.push({
      type: "input_image",
      detail: "high",
      image_url: furnitureImage,
    });
  }

  onProgress?.("proposal");
  const proposalResponse = await client.responses.parse({
    model: PLANNING_MODEL,
    instructions: PROPOSAL_GENERATION_INSTRUCTIONS,
    input: [{ role: "user", content: proposalContent }],
    reasoning: { effort: "medium" },
    text: {
      format: zodTextFormat(PlanningOutputSchema, "detail_page_planning"),
      verbosity: "medium",
    },
  });

  const output = proposalResponse.output_parsed;
  if (!output) {
    throw new Error("GPT가 기획안 구조를 완성하지 못했습니다.");
  }

  const references = processed.input.references.map((reference, index) => ({
    title: `레퍼런스 ${index + 1}`,
    address: reference.address,
    referencePoint: reference.referencePoint,
  }));

  return {
    mock: false,
    sourceSummary: processed.sourceSummary,
    references,
    candidates: output.candidates.map((candidate, index) => ({
      ...candidate,
      id: `plan-${Date.now()}-${index + 1}`,
      marketResearch: [],
      candidateReferences: references.map(reference => ({
        brandName: reference.title,
        referencePoint: reference.referencePoint,
      })),
    })),
    note: `${PLANNING_MODEL}로 의뢰 정보 가공과 기획안 생성을 완료했습니다.`,
    input: processed.input,
    metadata: { model: PLANNING_MODEL },
  };
}
