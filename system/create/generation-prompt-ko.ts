import type { GenerationPromptInput } from "@/system/create/generation-prompt";
import type { LibraryGenerationShot } from "@/system/create/generation-library";
import { createGenerationShots } from "@/system/create/generation-shots";
import type { GenerationRatio } from "@/system/create/generation-ratios";
import {
  legacyEditModeToRole,
  normalizeProductPreservation,
  normalizeReferenceStrength,
} from "@/system/create/reference-controls";

// Read-only companion to the English API prompt. Never use this text as a generation request.
const INTRO: Record<string, string> = {
  detail: "온라인 가구몰의 전문 제품 사진가로서 상세페이지에 사용할 이미지를 만드세요.",
  sns: "브랜드 SNS 피드를 기획하는 전문 콘텐츠 디자이너로서 인스타그램 피드용 이미지를 만드세요.",
  ad: "유료 광고의 아트 디렉터로서 카피를 넣을 깨끗한 여백이 있는 배너 광고 이미지를 만드세요.",
  lookbook: "브랜드 룩북 사진가로서 컷마다 일관된 시각적 톤을 지닌 룩북 이미지를 만드세요.",
  free: "전문 인테리어 사진가이자 스타일리스트의 관점에서 이미지를 만드세요.",
};

const SHOTS: Record<string, string> = {
  "detail-hero": "이번 컷은 제품의 메인 히어로 이미지입니다.",
  "detail-three-quarter": "이번 컷은 형태와 깊이를 보여 주는 45도 시점입니다.",
  "detail-closeup": "이번 컷은 소재와 제작 디테일을 강조하는 클로즈업입니다.",
  "detail-lifestyle": "이번 컷은 실제 공간 속 제품의 크기감을 보여 줍니다.",
  "sns-square": "이번 컷은 시선을 끄는 피드 구도입니다.",
  "sns-portrait": "이번 컷은 라이프스타일 피드 구도입니다.",
  "sns-story": "이번 컷은 화면을 가득 채우는 스토리 구도입니다.",
  "sns-ad": "이번 컷은 텍스트를 넣을 여백이 있는 광고 구도입니다.",
  "ad-wide": "이번 컷은 제품을 한쪽에 두고 옆에 카피 공간을 남기는 배너입니다.",
  "ad-vertical": "이번 컷은 텍스트를 안전하게 넣을 공간이 있는 배너입니다.",
  "ad-thumbnail": "이번 컷은 작은 크기에서도 알아보기 쉬운 썸네일입니다.",
  "look-front": "이번 컷은 깔끔한 정면 사진입니다.",
  "look-side": "이번 컷은 제품의 측면 윤곽을 보여 줍니다.",
  "look-lifestyle": "이번 컷은 스타일링된 라이프스타일 이미지입니다.",
  "look-detail": "이번 컷은 질감을 보여 주는 클로즈업입니다.",
  "free-1": "이번 컷은 제품 전체가 분명히 보이는 눈높이 히어로 시점입니다.",
  "free-2": "이번 컷은 제품의 깊이를 보여 주는 왼쪽 45도 시점입니다.",
  "free-3": "이번 컷은 제품을 알아볼 수 있게 유지하며 제작 디테일을 강조하는 근접 구도입니다.",
  "free-4": "이번 컷은 제품 주변에 충분한 여백이 있는 넓은 공간 구도입니다.",
  "free-5": "이번 컷은 제품의 실루엣을 드러내는 낮은 카메라 시점입니다.",
  "free-6": "이번 컷은 왼쪽 시점과 구별되는 오른쪽 45도 시점입니다.",
  "free-7": "이번 컷은 시각적 위계가 깔끔한 균형 잡힌 정면 구도입니다.",
  "free-8": "이번 컷은 목적 있는 여백을 둔 에디토리얼 비대칭 구도입니다.",
};

const ANGLES: Record<string, [string, string]> = {
  "angle-closeup": ["제품에 가까이 다가가 주 피사체가 프레임을 채우게 하세요.", "눈높이 정면에서 매우 얕은 심도의 매크로 촬영을 하세요. 소재 표면에 초점을 맞추고 결·직조·마감을 촉각적으로 표현하세요."],
  "angle-reverse": ["보이지 않는 제품 디테일을 지어내지 말고 반대편에서 다른 윤곽을 보여 주세요.", "45도 시점에서 85–135mm 망원 렌즈의 압축 원근을 사용하세요. 수직선을 평행하게 유지하고 배경은 부드럽게 흐리세요."],
  "angle-editorial": ["뒤로 물러나 눈높이 정면에서 긴 렌즈로 촬영하세요.", "85–135mm 망원 렌즈로 깊이를 압축하고 수직선을 평행하게 유지하며 배경을 부드럽게 흐리세요."],
  "angle-architectural": ["카메라를 바닥 가까이 낮추고 약간 위로 향하게 하세요.", "로우앵글 틸트시프트 건축 사진처럼 벽의 수직선을 왜곡 없이 유지하고 앞뒤를 선명하게 담으세요."],
  "angle-wide": ["뒤로 물러나 제품을 넓고 일관된 공간 안에 보여 주세요.", "충분한 여백을 두고 24–35mm 광각 렌즈로 편안한 거리에서 촬영하세요. 공간 전체와 제품의 배치를 보여 주되 왜곡을 보정하세요."],
};

const LIGHT: Record<string, string> = {
  "아침 햇살": "부드러운 아침 햇살, 상쾌하고 밝은 분위기",
  "한낮 자연광": "맑고 중립적인 한낮 자연광",
  "흐린 날 확산광": "대비가 낮고 그림자가 부드러운 흐린 날의 확산광",
  노을빛: "따뜻한 골든아워 빛과 길고 부드러운 그림자",
  블루아워: "따뜻한 실내 조명과 균형을 이룬 차가운 블루아워 주변광",
  "부드러운 스튜디오": "부드럽게 확산된 스튜디오 조명",
  "측면 채광": "표면 질감을 드러내는 측면의 방향성 있는 창가 빛",
  "역광 실루엣": "제품을 알아볼 수 있는 부드러운 역광과 섬세한 테두리 하이라이트",
  "따뜻한 간접조명": "강한 빛 반점이 없는 따뜻한 실내 간접조명",
  "드라마틱 대비": "대비가 강하고 극적인 조명",
};

const MOOD: Record<string, string> = {
  "모던 미니멀": "모던 미니멀 스타일",
  "따뜻 포근": "따뜻하고 포근하며 생활감 있는 스타일",
  럭셔리: "럭셔리 부티크 호텔 스타일",
  빈티지: "빈티지 레트로 스타일",
  재팬디: "유기적 질감과 차분한 중립 색조를 활용한 절제된 재팬디 스타일",
  스칸디나비안: "밝은 목재와 실용적 단순함을 살린 스칸디나비안 스타일",
  인더스트리얼: "콘크리트와 금속 포인트를 활용한 인더스트리얼 스타일",
  "내추럴 우드": "자연 목재 마감, 흙빛 질감과 유기적 색상 팔레트",
  "갤러리 화이트": "넉넉한 여백을 둔 차분한 화이트 갤러리 스타일",
};

const PROPS: Record<string, string> = {
  "소품 없음": "장식 소품 없이 제품과 꼭 필요한 공간 구조만 유지",
  식물: "식물과 초록 잎",
  러그: "질감 있는 러그",
  "커피/책": "커피, 책과 잡지",
  "벽 장식": "벽에 건 액자 그림",
  "도자기 화병": "절제된 도자기 화병",
  "플로어 램프": "조형적인 플로어 램프",
  "쿠션/블랭킷": "조화로운 쿠션과 자연스럽게 걸친 담요",
  오브제: "엄선된 작은 장식 오브제",
  커튼: "부드러운 리넨 커튼",
  "사이드 테이블": "주 제품을 가리지 않는 적절한 크기의 사이드 테이블",
};

function productRule(input: GenerationPromptInput): string {
  const preservation = normalizeProductPreservation(input.productPreservation);
  if (preservation === 100) return "첫 번째 이미지의 제품은 형태·비율·색상·소재까지 정확히 유지하세요.";
  if (preservation === 50) return "첫 번째 이미지의 제품 형태와 비율, 알아볼 수 있는 구조와 디테일을 유지하되 스타일에 맞는 미세한 소재·색상 변경은 허용하세요.";
  return "첫 번째 이미지 제품의 핵심 정체성·기능·기본 구조는 알아볼 수 있게 유지하고 색상·마감·스타일은 창의적으로 바꿀 수 있습니다.";
}

function referenceRule(input: GenerationPromptInput): string {
  const strength = normalizeReferenceStrength(input.referenceStrength);
  if (!input.referenceImage || strength === 0) {
    return "첫 번째 이미지의 제품을 중심으로 그럴듯한 공간을 새로 구성하세요. 참조할 두 번째 공간 이미지는 사용하지 않습니다.";
  }
  const intro = "두 번째 이미지는 참고 자료일 뿐이며, 제품의 출처는 첫 번째 이미지입니다. ";
  const role = input.referenceRole ?? legacyEditModeToRole(input.editMode);
  if (role === "space") {
    if (strength === 25) return intro + "실내 공간에 대한 느슨한 힌트만 얻으세요. 방은 새로 만들고 물건이나 구조를 복사하지 마세요.";
    if (strength === 50) return intro + "주요 공간 배치와 크기감을 빌리되 첫 번째 이미지 제품을 보여 주도록 조정하세요. 참조 가구의 특징을 제품에 옮기지 마세요.";
    return intro + "요청된 카메라 시점이 허용하는 범위에서 보이는 공간 구조와 주요 배치를 가깝게 따르고 첫 번째 이미지 제품을 그 공간에 배치하세요. 보이지 않는 부분까지 픽셀 단위로 동일하다고 가정하지 마세요. 카메라·채광·무드·소품의 명시적 설정이 우선합니다.";
  }
  if (role === "style") {
    if (strength === 25) return intro + "분위기만 약하게 참고하고 방·물건·프레이밍은 복사하지 마세요.";
    if (strength === 50) return intro + "채광과 색상 팔레트를 참고하여 새로운 장면을 구성하고 공간 배치나 가구는 복사하지 마세요.";
    return intro + "채광·색상 팔레트·분위기를 강하게 반영하되 구도는 새로 만들고 공간 구조나 물건은 복사하지 마세요. 명시한 스타일 설정이 우선합니다.";
  }
  const locked = normalizeProductPreservation(input.productPreservation) === 100;
  if (strength === 25) return intro + "주변 연출에만 소재·색감의 가벼운 힌트를 적용하세요.";
  if (strength === 50) return intro + (locked
    ? "주변 공간에만 표면 질감과 색감 팔레트를 적용하고 제품 자체의 소재·색상은 유지하세요. 공간 배치는 복사하지 마세요."
    : "제품의 형태를 유지하면서 어울리는 마감과 주변 공간에 질감·색감을 적용하세요. 공간 배치는 복사하지 마세요.");
  return intro + (locked
    ? "소재 느낌과 색감을 주변에 강하게 반영하되 제품의 원래 소재·색상은 유지하세요. 공간 배치나 무관한 물건은 복사하지 마세요. 명시한 스타일 설정이 우선합니다."
    : "제품의 구조를 알아볼 수 있게 유지하면서 어울리는 제품 마감과 주변 디테일에 소재 느낌·색감을 강하게 반영하세요. 공간 배치나 무관한 물건은 복사하지 마세요. 명시한 스타일 설정이 우선합니다.");
}

function formatRule(ratio: GenerationRatio): string {
  if (ratio === "original") return "원본 이미지 비율에 맞춰 구도를 잡고 제품 전체가 여유 있게 들어오도록 하세요.";
  const [width, height] = ratio.split(":").map(Number);
  const direction = width === height ? "정사각형" : width > height ? "가로" : "세로";
  return `최종 출력 비율은 ${ratio}(${direction})입니다. 이 프레임에 맞춰 피사체와 여백을 배치하고 제품의 중요한 부분을 자르지 마세요.`;
}

function styleRule(input: GenerationPromptInput): string {
  const tags = [
    LIGHT[input.light],
    MOOD[input.mood],
    ...input.props.map(prop => PROPS[prop]),
  ].filter(Boolean);
  return tags.length > 0
    ? `요청한 스타일 변경: ${tags.join(", ")}. 언급하지 않은 장면 요소는 유지하세요.`
    : "";
}

export function buildKoreanPromptPreviews(input: GenerationPromptInput): Record<string, string> {
  const shots = createGenerationShots(input);
  const isAngle = input.angleVariationIds.length > 0;
  const intro = isAngle
    ? "동일한 촬영을 이어가는 사진가처럼 작업하세요. 첫 번째 이미지는 제품이지 보존할 방이 아닙니다. 요청된 카메라 위치에서 그 제품을 다시 촬영하고 컷마다 정체성을 유지하세요."
    : INTRO[input.contentSet ?? "free"];
  const usesSpaceReference = Boolean(input.referenceImage)
    && normalizeReferenceStrength(input.referenceStrength) > 0
    && (input.referenceRole ?? legacyEditModeToRole(input.editMode)) === "space";
  const result: Record<string, string> = {};
  for (const shot of shots) {
    const angle = ANGLES[shot.id];
    const lines = [
      intro,
      ...(angle ? ["첫 번째 이미지는 제품의 기준이며 공간으로 보존하지 마세요."] : []),
      productRule(input),
      referenceRule(input),
      angle ? `이번 컷: ${angle[0]}` : SHOTS[shot.id],
      angle ? `카메라: ${angle[1]}` : "",
      formatRule(shot.ratio),
      styleRule(input),
      input.prompt.trim() ? `사용자 추가 지시(입력 원문): ${input.prompt.trim()}` : "",
      "지시가 충돌하면 제품 유지 → 선택한 카메라·출력 비율 → 명시적 텍스트·전문가 스타일 → 레퍼런스 힌트 순서로 우선하세요.",
      angle
        ? usesSpaceReference
          ? "가능하면 두 번째 이미지의 보이는 고정 구조를 유지하되 요청한 카메라 앵글이 원래 프레이밍보다 우선합니다. 사실적인 사진으로 표현하세요."
          : "필요하면 일관된 공간을 새로 만드세요. 첫 번째 이미지에 방이 있다고 가정하거나 스타일·소재 레퍼런스의 방 구조를 복사하지 마세요. 사실적인 사진으로 표현하세요."
        : "크기감과 접지 그림자가 자연스러운 사실적인 사진으로 표현하세요.",
    ];
    result[shot.id] = lines.filter(Boolean).join("\n\n");
  }
  return result;
}

export function getKoreanPromptForShot(shot: LibraryGenerationShot): string | null {
  if (shot.metadata.koreanPrompt) return shot.metadata.koreanPrompt;
  const settings = shot.metadata.generationSettings;
  if (!settings) return null;
  const input: GenerationPromptInput = {
    ...settings,
    referenceImage: shot.metadata.inputImages?.find(image => image.kind === "reference")?.imageUrl ?? null,
    editMode: settings.editMode ?? "swap",
  };
  const matchingShot = createGenerationShots(input).find(item => item.label === shot.label);
  return matchingShot ? buildKoreanPromptPreviews(input)[matchingShot.id] ?? null : null;
}
