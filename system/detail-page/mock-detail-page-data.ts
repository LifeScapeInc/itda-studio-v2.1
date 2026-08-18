import type {
  PlanningReference,
  ProcessedPlanningInput,
  TemplateStructureTile,
} from "@/system/detail-page/detail-page-types";

export const MOCK_PROCESSED_PLANNING_INPUT: ProcessedPlanningInput = {
  "keepExistingBrandTone": "",
  "basicInfo": {
    "productName": "노르딕 라인 테이블",
    "price": "",
    "discountPrice": "",
    "manufacturer": "자체 공장"
  },
  "productInfo": {
    "externalDimensions": [
      "1600 × 900 × 750 mm"
    ],
    "internalDimensions": [
      "다리 간격 1400 × 800 mm"
    ],
    "colorOptions": [
      "내추럴 오크"
    ],
    "weightAndLoadCapacity": []
  },
  "materialInfo": [
    {
      "material": "국내산 오크 원목",
      "materialGrade": "",
      "countryOfOrigin": "대한민국"
    }
  ],
  "content": {
    "storyFlow": "원목의 질감과 시간의 가치에서 시작해 소재·곡선 디테일, 기능과 치수, 공간 연출, 구매 및 배송 안내 순으로 전개",
    "copywriting": "10년을 써도 처음 같은, 원목의 힘",
    "coreSellingPoints": [
      "자연스러운 오크 원목의 결",
      "핸드피니싱",
      "둥글게 정리한 모서리와 다리 라인",
      "견고한 조립 구조"
    ],
    "excludedItems": "시장 화법과 외부 조사 결과는 사용하지 않음",
    "precautions": "원목 특성에 따른 나뭇결·색감 차이와 온습도, 물기, 열, 직사광선 관리 안내"
  },
  "trustElements": {
    "afterSalesServicePeriod": "2년 A/S",
    "qualityWarranty": "",
    "certifications": ""
  },
  "references": [
    {
      "address": "https://bricknine.co.kr/product/플레인-오크-원목식탁/1388/",
      "referencePoint": "기획/구성"
    },
    {
      "address": "https://woodique.co.kr/product/라인-테이블-세라믹/3598/",
      "referencePoint": "배경/분위기/컨셉"
    },
    {
      "address": "https://m.baum129.com/product/바움129-아데나-원목식탁-오크-참나무식탁-카페-6인용-4인용-2인-통원목/36/category/1/display/6/",
      "referencePoint": "소재 안내 톤"
    }
  ],
  "installation": {
    "assemblyRequired": "다리 조립 필요, 예상 약 15분",
    "installationRequired": "별도 설치비 없음",
    "components": [
      "상판",
      "다리 4개",
      "조립용 볼트",
      "육각렌치",
      "사용설명서"
    ]
  },
  "delivery": {
    "deliveryMethod": "택배 배송(박스 포장)",
    "parcelOrFreight": "택배",
    "shippingCostByOption": "전 지역 무료배송, 도서산간 지역 3,000원 추가"
  },
  "otherRequests": {
    "realPersonPhotos": "",
    "gif": "다리 조립 과정을 보여주는 GIF",
    "other": "다리 수평 조절 나사 포함"
  }
};

export const MOCK_PLANNING_REFERENCES: PlanningReference[] = [
  {
    "title": "레퍼런스 1",
    "address": "https://bricknine.co.kr/product/플레인-오크-원목식탁/1388/",
    "referencePoint": "기획/구성"
  },
  {
    "title": "레퍼런스 2",
    "address": "https://woodique.co.kr/product/라인-테이블-세라믹/3598/",
    "referencePoint": "배경/분위기/컨셉"
  },
  {
    "title": "레퍼런스 3",
    "address": "https://m.baum129.com/product/바움129-아데나-원목식탁-오크-참나무식탁-카페-6인용-4인용-2인-통원목/36/category/1/display/6/",
    "referencePoint": "소재 안내 톤"
  }
];

export const MOCK_TEMPLATE_STRUCTURES: Record<string, TemplateStructureTile[]> = {
  "plan-emotional": [
    {
      "type": "hero",
      "content": "오래 남는 원목의 결\n10년을 써도 처음 같은, 원목의 힘\n\n자연스러운 오크 원목의 결을 담고, 둥글게 정리한 라인으로 일상에 편안히 놓이는 테이블.",
      "imageLayout": "제공된 제품 정면 사선 컷 1장을 사용한다. 화면 전체를 채우는 단일 이미지로 구성하되, 상단 약 25%의 넓은 오프화이트 여백에 타이틀·슬로건을 좌측 정렬한다. 테이블은 화면 중앙보다 약간 아래에 배치하고, 상판의 긴 결 방향과 네 개의 다리 실루엣이 모두 읽히도록 유지한다. 제품 좌우에는 충분한 여백을 두며, 별도의 그래픽·이미지 겹침은 사용하지 않는다.",
      "imageCount": 1
    },
    {
      "type": "overview",
      "content": "시간의 결을 담은 테이블\n\n유행을 빠르게 따라가기보다, 소재가 가진 분위기와 오래 쓰기 좋은 균형에 집중했습니다. 오크 원목이 보여주는 결의 흐름과 따뜻한 색감, 매끈하게 이어지는 둥근 라인을 통해 공간에 차분한 중심을 더합니다.\n\n매일 식사를 나누고, 손을 올리고, 시간이 쌓일수록 자연스럽게 일상에 스며드는 원목 테이블입니다.",
      "imageLayout": "",
      "imageCount": 0
    },
    {
      "type": "material",
      "content": "나무마다 다른, 자연스러운 오크의 표정\n\n상판과 다리에 드러나는 결의 흐름은 원목이 지닌 고유한 특징입니다. 균일함보다 자연스러운 결의 차이를 즐기는 소재로, 빛과 시선에 따라 은은하게 달라지는 우드 톤을 보여줍니다.\n\n※ 원목 특성상 나뭇결과 색감의 차이가 있을 수 있습니다.",
      "imageLayout": "이미지 3장 구성. 1번은 상판 표면을 위에서 가까이 촬영한 가로형 매크로 컷으로, 섹션 상단 중앙에 전체 폭의 약 72% 크기로 배치한다. 나뭇결의 방향과 부드러운 색감이 분명히 보이도록 한다. 2번과 3번은 다리 또는 측면 목리의 서로 다른 결을 담은 세로형 디테일 컷으로, 1번 아래 좌우에 같은 크기로 나란히 배치한다. 각 이미지 사이와 바깥에는 넉넉한 오프화이트 여백을 유지하며, 이미지끼리 겹치지 않는다.",
      "imageCount": 3
    },
    {
      "type": "closeup",
      "content": "손끝까지 이어지는 부드러운 선\n\n상판 모서리의 완만한 라운드와 다리로 이어지는 곡선이 각진 인상을 덜어냅니다. 가까이에서 볼수록 드러나는 정돈된 라인은 원목의 결을 더욱 편안하게 느끼게 합니다.",
      "imageLayout": "이미지 3장 구성. 1번은 상판 코너의 라운드와 측면 두께가 함께 보이는 초근접 가로형 컷을 가장 크게, 섹션 상단에 배치한다. 2번은 상판 아래 프레임과 다리가 만나는 구조를 담은 세로형 컷으로 하단 좌측에 배치한다. 3번은 전면의 둥근 다리 라인을 낮은 시점에서 담은 세로형 컷으로 하단 우측에 배치한다. 상단 메인 이미지는 하단 두 이미지보다 약 1.5배 넓게 구성하고, 모든 이미지는 같은 따뜻한 자연광 톤으로 맞춘다. 겹침 없이 얇은 여백으로 분리한다.",
      "imageCount": 3
    },
    {
      "type": "features",
      "content": "오래 바라봐도 편안한 균형\n\n· 넓고 단정한 상판: 식사와 일상의 다양한 시간을 담기 좋은 평평한 테이블 면\n· 둥글게 정리한 모서리: 시선과 손끝에 닿는 인상을 부드럽게 만든 디테일\n· 안정감 있는 다리 구성: 상판의 가벼운 인상과 균형을 이루는 단정한 실루엣\n· 자연스러운 원목의 표정: 결의 차이까지 공간의 분위기로 받아들이는 소재감",
      "imageLayout": "",
      "imageCount": 0
    },
    {
      "type": "size",
      "content": "구매 전, 놓일 자리를 먼저 확인해 주세요\n\n제품의 가로 × 세로 × 높이와 상판 두께는 최종 사양 기준으로 표기해 주세요.\n\n권장 확인 항목\n· 테이블 주변 의자를 빼고 앉을 수 있는 여유 공간\n· 출입문, 엘리베이터, 복도 등 배송 이동 경로\n· 사용할 의자 높이와 테이블 하부 공간\n\n※ 실제 제작·측정 방식에 따라 치수에는 오차가 있을 수 있으므로, 최종 상품 사양을 기준으로 확인해 주세요.",
      "imageLayout": "",
      "imageCount": 0
    },
    {
      "type": "styling",
      "content": "햇살과 나무가 머무는 식사 공간\n\n오프화이트와 따뜻한 우드 톤이 어우러진 다이닝 공간에 테이블을 놓아 보세요. 계절이 바뀌고 소품이 달라져도 과하게 앞서지 않고, 공간의 일상을 차분하게 받쳐줍니다.",
      "imageLayout": "이미지 3장 구성. 1번은 부드러운 햇살이 드는 내추럴 다이닝 공간의 와이드 가로형 컷으로 섹션 첫 화면 전체 폭에 가장 크게 배치한다. 테이블 상판과 다리의 비례, 공간 속 여백이 함께 보이도록 촬영한다. 2번은 식기와 패브릭이 놓인 상판의 생활 장면을 담은 정사각형 또는 세로형 컷으로 하단 좌측에 배치한다. 3번은 의자와 테이블 다리, 바닥의 질감이 함께 보이는 낮은 시점의 세로형 컷으로 하단 우측에 배치한다. 소품은 아이보리·베이지·브라운 계열로 절제하고, 제품보다 소품이 강조되지 않게 한다. 하단 두 컷은 동일한 크기와 넓은 간격으로 정렬하며 이미지 겹침은 사용하지 않는다.",
      "imageCount": 3
    },
    {
      "type": "notice",
      "content": "원목 제품 구매 전 확인 사항\n\n· 원목은 소재 특성상 나뭇결, 색감, 옹이, 미세한 무늬가 제품마다 다를 수 있습니다.\n· 사용 환경의 온도와 습도 변화에 따라 원목의 상태가 달라질 수 있습니다.\n· 물기나 오염은 오래 두지 말고 부드러운 마른 천으로 닦아 주세요.\n· 강한 열, 직사광선, 날카로운 물체와의 직접적인 접촉은 피해 주세요.\n· 교환·반품 가능 여부와 비용은 상품의 최종 판매 정책 및 설치·사용 여부를 기준으로 안내해 주세요.\n\n자연 소재가 지닌 고유한 표정까지 확인한 뒤 구매해 주세요.",
      "imageLayout": "",
      "imageCount": 0
    },
    {
      "type": "delivery",
      "content": "배송·설치 안내\n\n주문 전 배송지의 출입문, 엘리베이터, 계단 및 복도 폭을 확인해 주세요. 배송 가능 일정, 설치 방식, 지역별 추가 비용 및 기존 가구 이동·수거 가능 여부는 최종 판매 정책에 따라 명확히 안내해 주세요.\n\n배송 당일에는 제품을 놓을 공간을 미리 비워 두면 보다 원활한 설치가 가능합니다.",
      "imageLayout": "",
      "imageCount": 0
    }
  ]
};

