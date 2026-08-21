export type DetailPageStep = "planning" | "draft" | "editor";

export type DetailTileKind = "image" | "info";

export type DetailTileType =
  | "hero"
  | "overview"
  | "closeup"
  | "material"
  | "size"
  | "features"
  | "styling"
  | "delivery"
  | "notice";

export type DetailTileDefinition = {
  type: DetailTileType;
  label: string;
  kind: DetailTileKind;
  description: string;
  prompt?: string;
  shotCount?: number;
  height: number;
};

export type DetailTile = DetailTileDefinition & {
  id: string;
  imageLayout?: string;
};

export type PlanningCandidate = {
  id: string;
  axisName: string;
  title: string;
  concept: string;
  description: string;
  targetCustomer: string;
  coreSlogan: string;
  keywords: string[];
  marketResearch: Array<{
    marketNarrative: string;
    ourNarrative: string;
    evidenceLevel: "추론됨" | "미실시" | "실측";
  }>;
  toneAndManner: {
    visual: string;
    photo: string;
    copy: string;
    typography: string;
    layout: string;
  };
  naming: {
    workingTitle: string;
    principles: string[];
  };
  candidateReferences: Array<{
    brandName: string;
    referencePoint: string;
  }>;
  notes: {
    exclusionCheck: string;
    otherUnreflected: string[];
    emptyControlFieldNotice: string;
  };
  tileTypes: DetailTileType[];
};

export type RequestDocument = {
  file: File;
  name: string;
  size: number;
  type: string;
};

export type PlanningReference = {
  title: string;
  address: string;
  referencePoint: string;
  description?: string;
  text?: string;
  images?: Array<{
    url: string;
    alt: string;
    context: string;
  }>;
  links?: string[];
  extractionStatus?: "success" | "partial" | "failed";
  warnings?: string[];
};

export type ProcessedPlanningInput = {
  keepExistingBrandTone: string;
  basicInfo: {
    productName: string;
    price: string;
    discountPrice: string;
    manufacturer: string;
  };
  productInfo: {
    externalDimensions: string[];
    internalDimensions: string[];
    colorOptions: string[];
    weightAndLoadCapacity: string[];
  };
  materialInfo: Array<{
    material: string;
    materialGrade: string;
    countryOfOrigin: string;
  }>;
  content: {
    storyFlow: string;
    copywriting: string;
    coreSellingPoints: string[];
    excludedItems: string;
    precautions: string;
  };
  trustElements: {
    afterSalesServicePeriod: string;
    qualityWarranty: string;
    certifications: string;
  };
  references: Array<{
    address: string;
    referencePoint: string;
  }>;
  installation: {
    assemblyRequired: string;
    installationRequired: string;
    components: string[];
  };
  delivery: {
    deliveryMethod: string;
    parcelOrFreight: string;
    shippingCostByOption: string;
  };
  otherRequests: {
    realPersonPhotos: string;
    gif: string;
    other: string;
  };
};

export type PlanningGenerationResponse = {
  mock: boolean;
  sourceSummary: string;
  candidates: PlanningCandidate[];
  references: PlanningReference[];
  note: string;
  input?: ProcessedPlanningInput;
  metadata?: {
    model?: string;
  };
  tokenUsage?: TokenUsage;
};

export type TemplateStructureTile = {
  type: DetailTileType;
  content: string;
  imageLayout: string;
  imageCount: number;
};

export type TemplateStructureResponse = {
  mock: boolean;
  tiles: TemplateStructureTile[];
  note: string;
  metadata?: {
    model?: string;
  };
  tokenUsage?: TokenUsage;
};

export const DETAIL_PAGE_STEPS: Array<{
  id: DetailPageStep;
  index: number;
  label: string;
}> = [
  { id: "planning", index: 1, label: "기획안" },
  { id: "draft", index: 2, label: "템플릿 제작" },
  { id: "editor", index: 3, label: "템플릿 편집" },
];

export const DETAIL_TILE_DEFINITIONS: DetailTileDefinition[] = [
  {
    type: "hero",
    label: "히어로 컷",
    kind: "image",
    description: "제품의 첫인상과 핵심 분위기를 전달하는 대표 이미지 영역",
    prompt: "제품의 형태를 정확히 유지한 정면 중심의 프리미엄 히어로 컷. 여백이 충분한 세로 상세페이지 구도.",
    shotCount: 1,
    height: 250,
  },
  {
    type: "overview",
    label: "제품 소개",
    kind: "info",
    description: "제품의 핵심 가치와 사용 장면을 짧게 소개하는 정보 영역",
    height: 150,
  },
  {
    type: "closeup",
    label: "클로즈업 컷",
    kind: "image",
    description: "마감과 구조적 디테일을 확대해 보여주는 이미지 영역",
    prompt: "입력 제품의 소재와 마감 디테일을 사실적으로 강조한 매크로 클로즈업. 왜곡 없이 선명한 질감 표현.",
    shotCount: 3,
    height: 210,
  },
  {
    type: "material",
    label: "소재 소개",
    kind: "image",
    description: "주요 소재의 색감과 질감을 설명하는 이미지 중심 영역",
    prompt: "제품에 사용된 소재의 결, 광택, 촉감을 전달하는 자연광 기반의 소재 디테일 이미지.",
    shotCount: 2,
    height: 200,
  },
  {
    type: "size",
    label: "사이즈 소개",
    kind: "info",
    description: "제품 치수와 공간 점유 정보를 전달하는 정보 영역",
    height: 170,
  },
  {
    type: "features",
    label: "기능 소개",
    kind: "info",
    description: "제품의 기능과 사용상 장점을 설명하는 정보 영역",
    height: 170,
  },
  {
    type: "styling",
    label: "공간 연출 컷",
    kind: "image",
    description: "실제 공간에서 제품이 사용되는 모습을 제안하는 이미지 영역",
    prompt: "입력 제품을 유지하면서 조화로운 인테리어 공간에 자연스럽게 배치한 라이프스타일 연출 컷.",
    shotCount: 2,
    height: 240,
  },
  {
    type: "delivery",
    label: "배송 방법",
    kind: "info",
    description: "배송 방식과 설치 절차를 안내하는 정보 영역",
    height: 150,
  },
  {
    type: "notice",
    label: "구매 안내",
    kind: "info",
    description: "구매 전 확인할 관리·교환·주의사항 정보 영역",
    height: 150,
  },
];

export const MOCK_PLANNING_CANDIDATES: PlanningCandidate[] = [
  {
    "id": "plan-emotional",
    "axisName": "시간의 결",
    "title": "오래 남는 원목의 결",
    "concept": "질감과 시간의 가치",
    "description": "오크 원목의 질감과 시간이 쌓이는 가치를 중심으로 소재 디테일과 편안한 균형을 보여주는 기획",
    "targetCustomer": "유행보다 소재의 분위기와 오래 사용할 가구의 균형을 중요하게 보는 내추럴 인테리어 고객",
    "coreSlogan": "10년을 써도 처음 같은, 원목의 힘",
    "keywords": [
      "오크 원목",
      "자연스러운 결",
      "핸드피니싱",
      "시간의 가치"
    ],
    "marketResearch": [],
    "toneAndManner": {
      "visual": "오프화이트 배경과 따뜻한 우드 톤을 중심으로, 여백이 넉넉한 내추럴·미니멀 무드",
      "photo": "상판 결, 모서리 라운드, 다리 라인을 가까이 담고 햇살이 부드럽게 드는 다이닝 공간 컷 구성",
      "copy": "짧고 차분한 문장으로 소재의 감각과 오래 쓰는 이유를 전달",
      "typography": "절제된 고딕 중심에 소제목만 가는 세리프를 보조적으로 사용",
      "layout": "큰 제품 컷 뒤 소재 디테일을 충분한 여백으로 배치하고, 신뢰 정보는 하단에 명료하게 정리"
    },
    "naming": {
      "workingTitle": "",
      "principles": []
    },
    "candidateReferences": [
      {
        "brandName": "레퍼런스 1",
        "referencePoint": "기획/구성"
      },
      {
        "brandName": "레퍼런스 2",
        "referencePoint": "배경/분위기/컨셉"
      },
      {
        "brandName": "레퍼런스 3",
        "referencePoint": "소재 안내 톤"
      }
    ],
    "notes": {
      "exclusionCheck": "위반 없음",
      "otherUnreflected": [],
      "emptyControlFieldNotice": "특이사항 없음"
    },
    "tileTypes": [
      "hero",
      "overview",
      "material",
      "closeup",
      "features",
      "size",
      "styling",
      "notice",
      "delivery"
    ]
  },
  {
    "id": "plan-functional",
    "axisName": "함께하는 식탁",
    "title": "일상을 담는 다이닝",
    "concept": "식사 장면 중심의 생활 서사",
    "description": "식사와 대화가 머무는 생활 장면에서 시작해 제품 비례와 사용 정보를 자연스럽게 확인시키는 기획",
    "targetCustomer": "식사와 대화를 위한 편안한 다이닝 공간을 만들고 싶은 2~4인 가구 고객",
    "coreSlogan": "매일의 식사가 머무는, 자연스러운 자리",
    "keywords": [
      "다이닝 일상",
      "1600mm 상판",
      "여유로운 하부",
      "라이프스타일"
    ],
    "marketResearch": [],
    "toneAndManner": {
      "visual": "밝고 절제된 다이닝룸에 리넨·도자기 등 자연 소재를 소량 더한 따뜻한 생활감",
      "photo": "제품 전체 비례를 보여주는 공간 컷과 식사 장면의 라이프스타일 컷 1~2장을 활용, 하부 공간도 명확히 촬영",
      "copy": "생활 장면을 떠올리게 하는 담백한 서술 뒤에 치수와 구성 정보를 정확히 제시",
      "typography": "가독성 높은 미니멀 고딕 위주, 정보 수치는 명확하게 강조",
      "layout": "라이프스타일 컷으로 시작해 제품 비례·치수·옵션을 순서대로 확인시키는 흐름"
    },
    "naming": {
      "workingTitle": "",
      "principles": []
    },
    "candidateReferences": [
      {
        "brandName": "레퍼런스 1",
        "referencePoint": "기획/구성"
      },
      {
        "brandName": "레퍼런스 2",
        "referencePoint": "배경/분위기/컨셉"
      },
      {
        "brandName": "레퍼런스 3",
        "referencePoint": "소재 안내 톤"
      }
    ],
    "notes": {
      "exclusionCheck": "위반 없음",
      "otherUnreflected": [],
      "emptyControlFieldNotice": "특이사항 없음"
    },
    "tileTypes": [
      "hero",
      "overview",
      "styling",
      "features",
      "size",
      "notice",
      "delivery"
    ]
  },
  {
    "id": "plan-balanced",
    "axisName": "정직한 완성",
    "title": "만드는 과정의 신뢰",
    "concept": "소재·마감·관리의 투명한 안내",
    "description": "소재와 제작·조립 방식, 관리와 사후 지원을 투명하게 안내해 구매 신뢰를 높이는 기획",
    "targetCustomer": "소재 정보와 제작·조립 방식, 사후 지원을 꼼꼼히 확인하고 구매하는 실용적 고객",
    "coreSlogan": "자연의 결부터, 오래 쓰는 과정까지",
    "keywords": [
      "국내산 오크",
      "자체 공장",
      "견고한 조립",
      "2년 A/S"
    ],
    "marketResearch": [],
    "toneAndManner": {
      "visual": "과장 없는 스튜디오 톤에 소재와 구조를 선명하게 보여주는 신뢰 중심의 내추럴 미니멀 연출",
      "photo": "상판 나뭇결·마감 디테일, 조립 부위, 수평 조절 나사 등을 명확한 클로즈업으로 촬영하고 다리 조립 GIF 포함",
      "copy": "감성 문구와 검증 가능한 정보를 구분해 간결하고 정확하게 안내",
      "typography": "정돈된 고딕 서체와 표·아이콘을 활용해 정보 위계를 분명하게 구성",
      "layout": "소재와 제작 과정, 규격·인증, 조립·관리, 배송·A/S 순으로 확인 부담을 낮춘 정보형 구성"
    },
    "naming": {
      "workingTitle": "",
      "principles": []
    },
    "candidateReferences": [
      {
        "brandName": "레퍼런스 1",
        "referencePoint": "기획/구성"
      },
      {
        "brandName": "레퍼런스 2",
        "referencePoint": "배경/분위기/컨셉"
      },
      {
        "brandName": "레퍼런스 3",
        "referencePoint": "소재 안내 톤"
      }
    ],
    "notes": {
      "exclusionCheck": "위반 없음",
      "otherUnreflected": [],
      "emptyControlFieldNotice": "특이사항 없음"
    },
    "tileTypes": [
      "hero",
      "material",
      "closeup",
      "features",
      "size",
      "notice",
      "delivery"
    ]
  }
];

export function createDetailTiles(types: DetailTileType[]): DetailTile[] {
  return types.flatMap((type, index) => {
    const definition = DETAIL_TILE_DEFINITIONS.find(item => item.type === type);
    return definition ? [{
      ...definition,
      id: `${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    }] : [];
  });
}

export function createDetailTilesFromStructure(
  structure: TemplateStructureTile[],
): DetailTile[] {
  return structure.flatMap((item, index) => {
    const definition = DETAIL_TILE_DEFINITIONS.find(tile => tile.type === item.type);
    if (!definition) return [];
    const imageLayout = definition.kind === "image" ? item.imageLayout.trim() : "";
    const content = item.content.trim() || definition.description;
    const maximum = item.type === "hero" ? 1 : 4;

    return [{
      ...definition,
      description: content,
      imageLayout: imageLayout || undefined,
      prompt: definition.kind === "image"
        ? imageLayout || definition.prompt
        : undefined,
      shotCount: definition.kind === "image"
        ? Math.max(1, Math.min(maximum, item.imageCount || 1))
        : undefined,
      id: `${item.type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    }];
  });
}
import type { TokenUsage } from "@/system/usage/token-usage";
