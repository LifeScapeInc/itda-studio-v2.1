export const REFERENCE_ROLE_OPTIONS = [
  { id: "space", label: "공간·배치", description: "방 구조와 제품 배치를 참고" },
  { id: "style", label: "분위기·채광", description: "색감과 조명만 참고" },
  { id: "material", label: "소재·색감", description: "표면 질감과 팔레트를 참고" },
] as const;

export type ReferenceRole = typeof REFERENCE_ROLE_OPTIONS[number]["id"];

export const REFERENCE_STRENGTH_STEPS = [
  { value: 0, label: "사용 안 함", description: "레퍼런스를 API에 보내지 않음" },
  { value: 25, label: "가볍게", description: "느낌만 참고" },
  { value: 50, label: "균형 있게", description: "선택한 역할의 핵심 요소 참고" },
  { value: 100, label: "강하게", description: "선택한 역할을 최대한 반영" },
] as const;

export function normalizeReferenceStrength(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 50;
  return value <= 0 ? 0 : value < 35 ? 25 : value < 75 ? 50 : 100;
}

export function legacyEditModeToRole(editMode: string | undefined): ReferenceRole {
  if (editMode === "mood") return "style";
  if (editMode === "material") return "material";
  return "space";
}
