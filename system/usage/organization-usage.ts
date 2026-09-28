export type UsageErrorCode =
  | "NOT_CONFIGURED"
  | "AUTH_REQUIRED"
  | "INVALID_RANGE"
  | "INVALID_KEY"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "UNAVAILABLE";

export type UsageApiError = {
  code: UsageErrorCode;
  error: string;
};

export type OrganizationUsage = {
  month: string;
  startTime: number;
  endTime: number;
  fetchedAt: string;
  scope: "organization" | "projects";
  projectIds: string[];
  costUsd: number | null;
  images: number | null;
  imageRequests: number | null;
  completionRequests: number | null;
  dailyCosts: Array<{ date: string; costUsd: number }>;
  models: Array<{ model: string; imageRequests: number; completionRequests: number; images: number }>;
  warnings: Array<UsageApiError & { source: "costs" | "images" | "completions" }>;
};

export function utcMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
