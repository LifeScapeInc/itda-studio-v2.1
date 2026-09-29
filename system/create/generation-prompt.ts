import {
  ANGLE_VARIATION_OPTIONS,
  CONTENT_SET_OPTIONS,
  type AngleVariationId,
  type ContentSetId,
  type GenerationQuality,
} from "@/system/create/generation-options";
import { createGenerationShots } from "@/system/create/generation-shots";
import type { GenerationRatio, ImageRatio } from "@/system/create/generation-ratios";
import {
  legacyEditModeToRole,
  normalizeProductPreservation,
  normalizeReferenceStrength,
  type ReferenceRole,
} from "@/system/create/reference-controls";

type PromptShot = {
  id: string;
  label: string;
  role: string;
};

type PromptTemplate = {
  role: string;
  purpose?: string;
  shots: PromptShot[];
};

export type GenerationPromptInput = {
  referenceImage: string | null;
  contentSet: ContentSetId | null;
  angleVariationIds: AngleVariationId[];
  freeCount: number;
  quality: GenerationQuality;
  editMode: string;
  productPreservation?: number;
  referenceStrength?: number;
  referenceRole?: ReferenceRole;
  aspectRatio?: ImageRatio;
  useSetRatios?: boolean;
  light: string;
  mood: string;
  props: string[];
  prompt: string;
};

export type GenerationPrompt = {
  id: string;
  label: string;
  prompt: string;
};

const DEFAULT_ROLE = "a professional interior photographer and stylist";
const PRODUCT_LOCK =
  "Keep the product from the first image exactly as it is — same shape, proportions, color, and material.";
const PRODUCT_FORM_LOCK =
  "Keep the product from the first image the same shape and proportions.";
const PHOTOREAL =
  "Photorealistic, with believable scale and natural contact shadows.";
const ANGLE_ROLE = "the same photographer continuing the same shoot";
const ANGLE_BODY =
  "Image 1 is the product, not a room to preserve. Re-photograph that product from the requested camera position. Keep its identity consistent across cuts.";

const CONTENT_PROMPT_TEMPLATES: Partial<
  Record<ContentSetId, PromptTemplate>
> = {
  detail: {
    role:
      "a professional product photographer shooting for an online furniture store",
    purpose: "images for a product detail page",
    shots: [
      { id: "detail-hero", label: "메인 히어로", role: "the main hero frame" },
      {
        id: "detail-three-quarter",
        label: "45도 컷",
        role: "a three-quarter view that shows form and depth",
      },
      {
        id: "detail-closeup",
        label: "디테일 컷",
        role: "a close-up on material and craftsmanship",
      },
      {
        id: "detail-lifestyle",
        label: "공간 연출 컷",
        role: "the piece living in a real room, showing scale",
      },
    ],
  },
  sns: {
    role: "a professional content designer art-directing a brand's social feed",
    purpose: "images to post on an Instagram feed",
    shots: [
      { id: "sns-square", label: "피드", role: "a scroll-stopping feed composition" },
      {
        id: "sns-portrait",
        label: "라이프스타일 피드",
        role: "a lifestyle feed composition",
      },
      { id: "sns-story", label: "스토리", role: "a full-bleed story composition" },
      {
        id: "sns-ad",
        label: "광고용",
        role: "an ad frame with room for text",
      },
    ],
  },
  ad: {
    role: "an art director designing paid media",
    purpose: "banner ad creatives with clean space for copy",
    shots: [
      {
        id: "ad-wide",
        label: "카피 공간 배너",
        role: "a banner with the piece to one side and copy space beside it",
      },
      {
        id: "ad-vertical",
        label: "텍스트 중심 배너",
        role: "a banner with text-safe zones",
      },
      {
        id: "ad-thumbnail",
        label: "썸네일",
        role: "a thumbnail that still reads at small size",
      },
    ],
  },
  lookbook: {
    role: "a photographer shooting a brand lookbook",
    purpose: "a lookbook spread with a consistent visual voice across frames",
    shots: [
      { id: "look-front", label: "전면", role: "the clean frontal plate" },
      { id: "look-side", label: "사이드", role: "the side profile" },
      {
        id: "look-lifestyle",
        label: "라이프스타일",
        role: "the styled lifestyle frame",
      },
      { id: "look-detail", label: "클로즈업", role: "the texture close-up" },
    ],
  },
};

const LIGHT_PROMPTS: Record<string, string> = {
  "아침 햇살": "soft morning sunlight, fresh and airy",
  "한낮 자연광": "clear neutral midday daylight",
  "흐린 날 확산광": "soft overcast daylight with gentle low-contrast shadows",
  노을빛: "warm golden-hour light, long soft shadows",
  블루아워: "cool blue-hour ambient light balanced with warm interior lights",
  "부드러운 스튜디오": "soft diffused studio lighting",
  "측면 채광": "directional window light from the side, revealing surface texture",
  "역광 실루엣": "gentle backlighting with a readable product and delicate rim highlights",
  "따뜻한 간접조명": "warm indirect interior lighting without harsh hotspots",
  "드라마틱 대비": "dramatic high-contrast lighting",
};

const MOOD_PROMPTS: Record<string, string> = {
  "모던 미니멀": "modern minimal styling",
  "따뜻 포근": "warm, cozy, lived-in",
  럭셔리: "luxury boutique hotel",
  빈티지: "vintage retro",
  재팬디: "restrained Japandi styling with organic textures and calm neutral tones",
  스칸디나비안: "bright Scandinavian styling with pale wood and practical simplicity",
  인더스트리얼: "industrial styling with concrete and metal accents",
  "내추럴 우드": "natural wood finishes, earthy textures and an organic palette",
  "갤러리 화이트": "quiet white gallery styling with generous breathing space",
};

const PROP_PROMPTS: Record<string, string> = {
  "소품 없음": "no decorative props; keep the product and essential room architecture only",
  식물: "plants and greenery",
  러그: "a textured rug",
  "커피/책": "coffee, books, magazines",
  "벽 장식": "framed art on the wall",
  "도자기 화병": "a restrained ceramic vase",
  "플로어 램프": "a sculptural floor lamp",
  "쿠션/블랭킷": "coordinated cushions and a casually draped blanket",
  오브제: "a small curated decorative object",
  커튼: "soft linen curtains",
  "사이드 테이블": "a proportionate side table that does not obscure the main product",
};

function getProductLock(input: GenerationPromptInput): string {
  const preservation = normalizeProductPreservation(input.productPreservation);
  if (preservation === 100) return PRODUCT_LOCK;
  if (preservation === 50) {
    return `${PRODUCT_FORM_LOCK} Preserve recognizable construction and details, but allow subtle material and color adaptations to suit the styling direction.`;
  }
  return "Keep the core identity and function of the product from the first image recognizable. Allow creative changes to its color, finish, and styling, but retain its underlying structure.";
}

function getReferenceDirection(input: GenerationPromptInput): string {
  if (!input.referenceImage || normalizeReferenceStrength(input.referenceStrength) === 0) {
    return "Build a believable scene around the product in Image 1 from scratch. No reference scene is supplied.";
  }
  const role = input.referenceRole ?? legacyEditModeToRole(input.editMode);
  const strength = normalizeReferenceStrength(input.referenceStrength);
  const intro = "Image 2 is a reference only; Image 1 remains the product source.";
  if (role === "space") {
    if (strength === 25) return `${intro} Use Image 2 only as a loose interior setting cue. Create a new room; do not copy its objects or geometry.`;
    if (strength === 50) return `${intro} Borrow the main spatial layout and scale cues from Image 2, adapting them to display the product from Image 1. Do not transfer the reference furniture into the product.`;
    return `${intro} Follow Image 2's visible room architecture and major placement closely where the requested camera view allows. Place the product from Image 1 into that space; do not claim pixel-identical geometry outside the visible reference. Requested camera, light, mood, and props override matching reference aspects.`;
  }
  if (role === "style") {
    if (strength === 25) return `${intro} Borrow only a subtle mood cue from Image 2. Do not copy its room, objects, or framing.`;
    if (strength === 50) return `${intro} Borrow Image 2's lighting and palette for a newly composed scene. Do not copy its room layout or furniture.`;
    return `${intro} Strongly adapt Image 2's lighting, color palette, and atmosphere. Create a new composition; do not copy its room geometry or objects. Explicit styling settings take priority.`;
  }
  const productLocked = normalizeProductPreservation(input.productPreservation) === 100;
  if (strength === 25) return `${intro} Borrow subtle material and color cues from Image 2 for the surrounding styling only.`;
  if (strength === 50) return `${intro} Borrow Image 2's surface textures and palette ${productLocked ? "for the surroundings only; leave the product's own material and color unchanged" : "for compatible product finishes and surroundings while retaining the product's form"}. Do not copy its room layout.`;
  return `${intro} Strongly adapt Image 2's material language and palette ${productLocked ? "in the surroundings only; the product's original material and color remain unchanged" : "to compatible product finishes and surrounding details while retaining recognizable construction"}. Do not copy its room layout or unrelated objects. Explicit styling settings take priority.`;
}

function getFormatInstruction(ratio: GenerationRatio): string {
  if (ratio === "original") return "Compose for the original image aspect ratio; keep the product comfortably inside the frame.";
  const [width, height] = ratio.split(":").map(Number);
  const orientation = width === height ? "square" : width > height ? "landscape" : "portrait";
  return `Final output aspect ratio: ${ratio} (${orientation}). Arrange subject and negative space for this exact frame; do not crop away essential product features.`;
}

function getStylePrompt(input: GenerationPromptInput): string {
  const tags = [
    LIGHT_PROMPTS[input.light],
    MOOD_PROMPTS[input.mood],
    ...input.props.map((prop) => PROP_PROMPTS[prop]),
  ].filter((value): value is string => Boolean(value));

  return tags.length > 0 ? `Requested styling changes: ${tags.join(", ")}. Apply these changes while preserving unmentioned scene elements.` : "";
}

function normalizeUserPrompt(value: string): string {
  const normalized = value.trim().replace(/\.+$/, "");
  return normalized ? `${normalized}.` : "";
}

function composePrompt(
  input: GenerationPromptInput,
  template: PromptTemplate,
  ratio: GenerationRatio,
  shotRole?: string,
): string {
  const lines = [
    template.purpose
      ? `Act as ${template.role}. Create ${template.purpose}.`
      : `Act as ${template.role || DEFAULT_ROLE}.`,
    getProductLock(input),
    input.referenceImage
      ? getReferenceDirection(input)
      : "Build a believable interior scene around the product from scratch.",
    shotRole ? `This frame: ${shotRole}.` : "",
    getFormatInstruction(ratio),
    getStylePrompt(input),
    normalizeUserPrompt(input.prompt),
    PHOTOREAL,
  ];

  return lines.filter(Boolean).join("\n\n");
}

function getFreePrompt(input: GenerationPromptInput): GenerationPrompt[] {
  const shots = createGenerationShots(input);
  const template: PromptTemplate = {
    role: DEFAULT_ROLE,
    shots: [],
  };
  const cutRoles = [
    "an eye-level hero view showing the full product clearly",
    "a three-quarter view from the left showing the product's depth",
    "a closer frame emphasizing craftsmanship while keeping the product identifiable",
    "a wider contextual view with generous breathing room around the product",
    "a low camera view that reveals the product's silhouette",
    "a three-quarter view from the right, distinct from the left view",
    "a balanced frontal composition with clean visual hierarchy",
    "an editorial off-center composition with purposeful negative space",
  ];
  return shots.map((shot, index) => ({
    id: shot.id,
    label: shot.label,
    prompt: composePrompt(input, template, shot.ratio, cutRoles[index]),
  }));
}

function getAngleVariationPrompts(
  input: GenerationPromptInput,
): GenerationPrompt[] {
  const ratios = new Map(createGenerationShots(input).map(shot => [shot.id, shot.ratio]));
  const usesSpaceReference = Boolean(input.referenceImage)
    && normalizeReferenceStrength(input.referenceStrength) > 0
    && (input.referenceRole ?? legacyEditModeToRole(input.editMode)) === "space";
  return ANGLE_VARIATION_OPTIONS
    .filter((option) => input.angleVariationIds.includes(option.id))
    .map((option) => ({
      id: `angle-${option.id}`,
      label: option.label,
      prompt: [
        `Act as ${ANGLE_ROLE}.`,
        ANGLE_BODY,
        getProductLock(input),
        getReferenceDirection(input),
        `This frame: ${option.shotRole}.`,
        `Camera: ${option.compositionPrompt}, ${option.techniquePrompt}.`,
        getFormatInstruction(ratios.get(`angle-${option.id}`) ?? "original"),
        getStylePrompt(input),
        normalizeUserPrompt(input.prompt),
        usesSpaceReference
          ? "Preserve visible fixed architecture from Image 2 where plausible, but the requested camera angle takes priority over its original framing. Photorealistic."
          : "Invent a coherent setting if needed; do not assume Image 1 contains a room or copy room geometry from a style/material reference. Photorealistic.",
      ].filter(Boolean).join("\n\n"),
    }));
}

export function buildGenerationPrompts(
  input: GenerationPromptInput,
): GenerationPrompt[] {
  if (input.angleVariationIds.length > 0) {
    return getAngleVariationPrompts(input);
  }

  if (!input.contentSet) {
    return [];
  }

  if (input.contentSet === "free") {
    return getFreePrompt(input);
  }

  const template = CONTENT_PROMPT_TEMPLATES[input.contentSet];
  if (!template) {
    return [];
  }

  const ratios = new Map(createGenerationShots(input).map(shot => [shot.id, shot.ratio]));
  return template.shots.map((shot) => ({
    id: shot.id,
    label: shot.label,
    prompt: composePrompt(input, template, ratios.get(shot.id) ?? "original", shot.role),
  }));
}

export function getContentSetLabel(contentSet: ContentSetId | null): string {
  return CONTENT_SET_OPTIONS.find((option) => option.id === contentSet)?.label
    ?? "콘텐츠 세트 미선택";
}

export function getGenerationModeLabel(
  contentSet: ContentSetId | null,
  angleVariationIds: AngleVariationId[],
): string {
  return angleVariationIds.length > 0
    ? "앵글 변주"
    : getContentSetLabel(contentSet);
}
