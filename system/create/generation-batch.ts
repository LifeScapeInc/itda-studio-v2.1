import { GENERATION_OPTION_TEXT } from "./generation-option-text";

export const PURPOSE_OPTIONS = [
  { id: "general", label: "일반" }, { id: "banner", label: "배너" },
  { id: "thumbnail", label: "썸네일" }, { id: "story", label: "스토리" },
] as const;
export const COMPOSITION_OPTIONS = [
  { id: "standard", label: "기본" }, { id: "three_quarter", label: "사선" },
  { id: "side", label: "사이드" }, { id: "detail", label: "디테일" },
  { id: "environmental", label: "공간 포함" }, { id: "reverse", label: "리버스" },
  { id: "low_angle", label: "로우앵글" },
] as const;
export const RATIO_OPTIONS = ["1:1", "3:4", "4:5", "9:16", "16:9", "3:2"] as const;
export type GenerationPurpose = typeof PURPOSE_OPTIONS[number]["id"];
export type GenerationComposition = typeof COMPOSITION_OPTIONS[number]["id"];
export type BatchRatio = typeof RATIO_OPTIONS[number];
export type MakeSettings = { purpose: GenerationPurpose; composition: GenerationComposition; ratio: BatchRatio; };
export type PresetId = "detail" | "sns" | "ad" | "lookbook" | "angle";
export type GenerationMake = MakeSettings & { id: string; kind: "make"; quantity: number; };
export type GenerationPreset = { id: string; kind: "preset"; presetId: PresetId; quantity: number; };
export type BatchEntry = GenerationMake | GenerationPreset;
const make = (composition: GenerationComposition, ratio: BatchRatio, purpose: GenerationPurpose = "general"): MakeSettings => ({ purpose, composition, ratio });

// Preset decomposition: docs/generation-preset-decomposition.md, template mapping.
export const GENERATION_PRESETS: Record<PresetId, { label: string; makes: MakeSettings[]; }> = {
  detail: { label: "상세페이지", makes: [make("standard", "3:4"), make("three_quarter", "1:1"), make("detail", "1:1"), make("environmental", "16:9")] },
  sns: { label: "SNS", makes: [make("standard", "1:1"), make("environmental", "4:5"), make("standard", "9:16", "story"), make("standard", "1:1", "banner")] },
  ad: { label: "광고", makes: [make("standard", "16:9", "banner"), make("standard", "9:16", "banner"), make("standard", "1:1", "thumbnail")] },
  lookbook: { label: "룩북", makes: [make("standard", "3:4"), make("side", "3:4"), make("environmental", "3:4"), make("detail", "3:4")] },
  angle: { label: "앵글 변주", makes: [make("detail", "3:2"), make("reverse", "3:2"), make("standard", "3:2"), make("low_angle", "3:2"), make("environmental", "3:2")] },
};
export const BATCH_RESOLUTIONS: Record<BatchRatio, string> = {
  "1:1": "1024×1024", "3:4": "1152×1536", "4:5": "1024×1280",
  "9:16": "1152×2048", "16:9": "2048×1152", "3:2": "1536×1024",
};
export function normalizeQuantity(quantity: number): number {
  return Number.isFinite(quantity) ? Math.min(20, Math.max(1, Math.floor(quantity))) : 1;
}
export function newMake(id = crypto.randomUUID()): GenerationMake {
  return { id, kind: "make", purpose: "general", composition: "standard", ratio: "1:1", quantity: 1 };
}
type LegacyFreePreset = { id: string; kind: "preset"; presetId: "free"; quantity: number; };
export function cloneBatch(entries: (BatchEntry | LegacyFreePreset)[]): BatchEntry[] {
  return entries.map(entry => entry.kind === "preset" && entry.presetId === "free"
    ? { ...newMake(entry.id), quantity: normalizeQuantity(entry.quantity) }
    : { ...entry });
}
export function getMakeLabel(settings: MakeSettings): string {
  return `${PURPOSE_OPTIONS.find(option => option.id === settings.purpose)?.label}_${COMPOSITION_OPTIONS.find(option => option.id === settings.composition)?.label}`;
}
export function expandBatch(entries: BatchEntry[]) {
  return entries.flatMap(entry => {
    const makes = entry.kind === "preset" ? GENERATION_PRESETS[entry.presetId].makes : [entry];
    return Array.from({ length: normalizeQuantity(entry.quantity) }, (_, copy) => makes.map((settings, index) => ({
      ...settings,
      id: `${entry.id}-${index + 1}-${copy + 1}`,
      makeId: entry.id,
      label: `${entry.kind === "preset" ? `${GENERATION_PRESETS[entry.presetId].label.replace(/\s/g, "")}_` : ""}${getMakeLabel(settings)}`,
      resolution: BATCH_RESOLUTIONS[settings.ratio],
    }))).flat();
  });
}
export function getBatchCount(entries: BatchEntry[]): number {
  return entries.reduce((total, entry) => total + normalizeQuantity(entry.quantity) * (entry.kind === "preset" ? GENERATION_PRESETS[entry.presetId].makes.length : 1), 0);
}
export function getBatchLabel(entries: BatchEntry[]): string {
  if (entries.length === 1 && entries[0].kind === "preset") return GENERATION_PRESETS[entries[0].presetId].label;
  return `일괄 생성 · ${getBatchCount(entries)}컷`;
}
export function composeMakePrompt(settings: MakeSettings, prefix: string = GENERATION_OPTION_TEXT.COMMON_PREFIX, suffix: string = GENERATION_OPTION_TEXT.COMMON_SUFFIX): string {
  return [prefix, GENERATION_OPTION_TEXT[settings.purpose], GENERATION_OPTION_TEXT[settings.composition], GENERATION_OPTION_TEXT[settings.ratio], suffix].join("\n\n");
}
