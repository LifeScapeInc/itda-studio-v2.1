export type IntegrationCase = {
  id?: string | null;
  email: string | null;
  name: string | null;
  case_name: string | null;
  delivery_due_date: string | null;
  status: string | null;
  service_label: string | null;
  project_exists?: boolean | null;
  project_id?: string | null;
};
export type CasesResponse = {
  cases: IntegrationCase[];
};
export type CustomerCaseGroup = {
  email: string;
  manager: string;
  caseCount: number;
  cases: IntegrationCase[];
};
export function isCasesResponse(value: unknown): value is CasesResponse {
  return Boolean(value && typeof value === "object" && "cases" in value && Array.isArray((value as {
    cases?: unknown;
  }).cases));
}
export function groupCasesByEmail(cases: IntegrationCase[]): CustomerCaseGroup[] {
  const groups = new Map<string, CustomerCaseGroup>();
  for (const item of cases) {
    const email = item.email?.trim().toLowerCase() ?? "";
    if (!email) continue;
    const manager = item.name?.trim() || "담당자 미지정";
    const existing = groups.get(email);
    if (existing) {
      existing.cases.push(item);
      existing.caseCount = existing.cases.length;
      if (existing.manager === "담당자 미지정" && manager !== "담당자 미지정") {
        existing.manager = manager;
      }
      continue;
    }
    groups.set(email, {
      email,
      manager,
      caseCount: 1,
      cases: [item]
    });
  }
  return Array.from(groups.values());
}
export function getCaseKey(item: IntegrationCase): string {
  if (item.id?.trim()) return item.id.trim();
  return [item.email, item.case_name, item.delivery_due_date, item.service_label].map(value => value?.trim().toLowerCase() ?? "").join("::");
}
export function hasExistingProject(item: IntegrationCase): boolean {
  return item.project_exists === true || Boolean(item.project_id);
}
