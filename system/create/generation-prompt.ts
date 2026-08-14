import {
  ANGLE_VARIATION_OPTIONS,
  CONTENT_SET_OPTIONS,
  normalizeFreeCount,
  type AngleVariationId,
  type ContentSetId,
  type GenerationQuality,
} from "@/system/create/generation-options";

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
  "Treat the first image as a finished photo of a real room. Re-photograph that same room from a different camera position — as if the photographer walked to another spot during the same shoot. Everything in the room stays identical; only the camera moves.";
const ANGLE_CONSTRAINTS =
  "Same room photographed twice, not two similar rooms. If something falls outside the new frame, omit it — never invent a replacement. Photorealistic.";

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
      { id: "sns-square", label: "피드 1:1", role: "the scroll-stopping square" },
      {
        id: "sns-portrait",
        label: "피드 4:5",
        role: "a vertical lifestyle post",
      },
      { id: "sns-story", label: "스토리 9:16", role: "a full-bleed story frame" },
      {
        id: "sns-ad",
        label: "광고용 1:1",
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
        label: "배너 와이드",
        role: "a wide banner with the piece to one side and copy space beside it",
      },
      {
        id: "ad-vertical",
        label: "배너 세로",
        role: "a tall banner with text-safe zones",
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
  노을빛: "warm golden-hour light, long soft shadows",
  "부드러운 스튜디오": "soft diffused studio lighting",
  "드라마틱 대비": "dramatic high-contrast lighting",
};

const MOOD_PROMPTS: Record<string, string> = {
  "모던 미니멀": "modern minimal styling",
  "따뜻 포근": "warm, cozy, lived-in",
  럭셔리: "luxury boutique hotel",
  빈티지: "vintage retro",
};

const PROP_PROMPTS: Record<string, string> = {
  식물: "plants and greenery",
  러그: "a textured rug",
  "커피/책": "coffee, books, magazines",
  "벽 장식": "framed art on the wall",
};

function getInputRelationship(
  hasReference: boolean,
  editMode: string,
): {
  lock: string;
  body: string;
} {
  if (!hasReference) {
    return {
      lock: PRODUCT_LOCK,
      body: "Build a believable interior scene around the product from scratch.",
    };
  }

  if (editMode === "mood") {
    return {
      lock: PRODUCT_LOCK,
      body:
        "Borrow only the mood, light, and color of the reference image. Build a new scene around the product.",
    };
  }

  if (editMode === "material") {
    return {
      lock: PRODUCT_FORM_LOCK,
      body:
        "Use the reference image as material and color guidance. Restyle the product surface while preserving its construction.",
    };
  }

  return {
    lock: PRODUCT_LOCK,
    body:
      "Use the reference image exactly as it is. Swap the furniture for the product and change nothing else — same background, light, props, and framing.",
  };
}

function getStylePrompt(input: GenerationPromptInput): string {
  const tags = [
    LIGHT_PROMPTS[input.light],
    MOOD_PROMPTS[input.mood],
    ...input.props.map((prop) => PROP_PROMPTS[prop]),
  ].filter((value): value is string => Boolean(value));

  return tags.length > 0 ? `Lean toward: ${tags.join(", ")}.` : "";
}

function normalizeUserPrompt(value: string): string {
  const normalized = value.trim().replace(/\.+$/, "");
  return normalized ? `${normalized}.` : "";
}

function composePrompt(
  input: GenerationPromptInput,
  template: PromptTemplate,
  shotRole?: string,
): string {
  const relationship = getInputRelationship(
    Boolean(input.referenceImage),
    input.editMode,
  );
  const lines = [
    template.purpose
      ? `Act as ${template.role}. Create ${template.purpose}.`
      : `Act as ${template.role || DEFAULT_ROLE}.`,
    relationship.lock,
    relationship.body,
    shotRole ? `This frame: ${shotRole}.` : "",
    getStylePrompt(input),
    normalizeUserPrompt(input.prompt),
    PHOTOREAL,
  ];

  return lines.filter(Boolean).join("\n\n");
}

function getFreePrompt(input: GenerationPromptInput): GenerationPrompt[] {
  const count = normalizeFreeCount(input.freeCount);
  const template: PromptTemplate = {
    role: DEFAULT_ROLE,
    shots: [],
  };

  return [
    {
      id: "free-common",
      label: `자유 생성 · ${count}컷 공통`,
      prompt: composePrompt(input, template),
    },
  ];
}

function getAngleVariationPrompts(
  input: GenerationPromptInput,
): GenerationPrompt[] {
  return ANGLE_VARIATION_OPTIONS
    .filter((option) => input.angleVariationIds.includes(option.id))
    .map((option) => ({
      id: `angle-${option.id}`,
      label: option.label,
      prompt: [
        `Act as ${ANGLE_ROLE}.`,
        ANGLE_BODY,
        `This frame: ${option.shotRole}.`,
        `Camera: ${option.compositionPrompt}, ${option.techniquePrompt}.`,
        ANGLE_CONSTRAINTS,
      ].join("\n\n"),
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

  return template.shots.map((shot) => ({
    id: shot.id,
    label: shot.label,
    prompt: composePrompt(input, template, shot.role),
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
