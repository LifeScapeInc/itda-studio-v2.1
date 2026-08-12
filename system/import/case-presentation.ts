const FINAL_STATUSES = new Set(["completed", "delivered", "done", "final"]);
export function getDraftVariant(status: string | null): "draft" | "final" {
  const normalizedStatus = status?.trim().toLowerCase() ?? "";
  return FINAL_STATUSES.has(normalizedStatus) ? "final" : "draft";
}
export function getDeadlineLabel(value: string | null): string {
  if (!value?.trim()) return "마감일 미정";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "마감일 미정";
  const dueAt = Date.UTC(year, month - 1, day);
  const now = new Date();
  const todayAt = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.ceil((dueAt - todayAt) / 86_400_000);
  return days >= 0 ? `마감까지 D-${days}` : `마감일 ${Math.abs(days)}일 경과`;
}
