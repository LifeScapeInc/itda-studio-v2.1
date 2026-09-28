import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import {
  utcMonthKey,
  type OrganizationUsage,
  type UsageApiError,
  type UsageErrorCode,
} from "@/system/usage/organization-usage";

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 24;
const MAX_PAGES = 50;
const API_ORIGIN = "https://api.openai.com/v1/organization";

const Count = z.number().int().nonnegative();
const CostResult = z.object({
  object: z.literal("organization.costs.result"),
  amount: z.object({ currency: z.literal("usd"), value: z.number().finite() }),
});
const ImageResult = z.object({
  object: z.literal("organization.usage.images.result"),
  images: Count,
  num_model_requests: Count,
  model: z.string().nullish(),
});
const CompletionResult = z.object({
  object: z.literal("organization.usage.completions.result"),
  num_model_requests: Count,
  model: z.string().nullish(),
});

type Bucket<T> = { start_time: number; end_time: number; results: T[] };
type UsageRange = { month: string; startTime: number; endTime: number };
type Configuration = { adminKey: string; projectIds: string[] };

export class OpenAIUsageError extends Error {
  readonly code: UsageErrorCode;
  readonly status: number;

  constructor(code: UsageErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function resolveUsageRange(month: string, now = new Date()): UsageRange {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) || month < "2020-01" || month > utcMonthKey(now)) {
    throw new OpenAIUsageError("INVALID_RANGE", "2020년 1월부터 이번 달까지 조회할 수 있습니다.", 400);
  }
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    month,
    startTime: Date.UTC(year, monthNumber - 1, 1) / 1000,
    endTime: Math.min(Date.UTC(year, monthNumber, 1) / 1000, Math.floor(now.getTime() / 1000)),
  };
}

function configuration(): Configuration {
  const adminKey = process.env.OPENAI_ADMIN_KEY?.trim();
  if (!adminKey) {
    throw new OpenAIUsageError(
      "NOT_CONFIGURED",
      "사용량 조회 연결이 필요합니다. 서버의 .env.local에 OPENAI_ADMIN_KEY를 설정한 뒤 서버를 다시 시작해 주세요. 이미지 생성용 API 키와는 별도입니다.",
      503,
    );
  }
  const projectIds = Array.from(new Set(
    (process.env.OPENAI_USAGE_PROJECT_IDS ?? "").split(",").map(value => value.trim()).filter(Boolean),
  )).sort();
  return { adminKey, projectIds };
}

function responseError(status: number): OpenAIUsageError {
  if (status === 401) {
    return new OpenAIUsageError("INVALID_KEY", "OpenAI 관리 키가 유효하지 않습니다. 서버의 OPENAI_ADMIN_KEY를 확인해 주세요.", 502);
  }
  if (status === 403) {
    return new OpenAIUsageError("FORBIDDEN", "이 관리 키에 조직 사용량 조회 권한이 없습니다. OpenAI 조직 관리자에게 권한을 확인해 주세요.", 502);
  }
  if (status === 429) {
    return new OpenAIUsageError("RATE_LIMITED", "OpenAI 사용량 조회 요청이 일시적으로 제한되었습니다. 잠시 후 다시 확인해 주세요.", 429);
  }
  return new OpenAIUsageError("UNAVAILABLE", "OpenAI 사용량을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.", 502);
}

function safeError(error: unknown): OpenAIUsageError {
  // Never return upstream response bodies, URLs, or credential details to the browser.
  return error instanceof OpenAIUsageError ? error : responseError(502);
}

async function fetchBuckets<T>(
  endpoint: "costs" | "usage/images" | "usage/completions",
  resultSchema: z.ZodType<T>,
  range: UsageRange,
  config: Configuration,
  signal: AbortSignal,
): Promise<Array<Bucket<T>>> {
  const pageSchema = z.object({
    data: z.array(z.object({
      start_time: z.number().int(),
      end_time: z.number().int(),
      results: z.array(resultSchema),
    })),
    has_more: z.boolean(),
    next_page: z.string().nullable(),
  });
  const buckets: Array<Bucket<T>> = [];
  const seenPages = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API_ORIGIN}/${endpoint}`);
    url.searchParams.set("start_time", String(range.startTime));
    url.searchParams.set("end_time", String(range.endTime));
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.set("limit", "31");
    for (const projectId of config.projectIds) url.searchParams.append("project_ids[]", projectId);
    if (endpoint !== "costs") url.searchParams.append("group_by[]", "model");
    if (cursor) url.searchParams.set("page", cursor);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.adminKey}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal,
    });
    if (!response.ok) throw responseError(response.status);
    const payload = pageSchema.safeParse(await response.json());
    if (!payload.success) throw responseError(502);
    buckets.push(...payload.data.data);
    if (!payload.data.has_more) return buckets;
    cursor = payload.data.next_page;
    if (!cursor || seenPages.has(cursor)) throw responseError(502);
    seenPages.add(cursor);
  }
  // An incomplete page set must never appear as a complete total.
  throw responseError(502);
}

async function fetchUsage(range: UsageRange, config: Configuration): Promise<OrganizationUsage> {
  const signal = AbortSignal.timeout(20_000);
  const results = await Promise.allSettled([
    fetchBuckets("costs", CostResult, range, config, signal),
    fetchBuckets("usage/images", ImageResult, range, config, signal),
    fetchBuckets("usage/completions", CompletionResult, range, config, signal),
  ]);
  if (results.every(result => result.status === "rejected")) {
    throw safeError((results[0] as PromiseRejectedResult).reason);
  }
  const [costResult, imageResult, completionResult] = results;
  const warnings: OrganizationUsage["warnings"] = [];
  const sources = ["costs", "images", "completions"] as const;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const error = safeError(result.reason);
      warnings.push({ source: sources[index], code: error.code, error: error.message });
    }
  });

  const dailyCosts = new Map<string, number>();
  let costUsd: number | null = null;
  if (costResult.status === "fulfilled") {
    costUsd = 0;
    for (const bucket of costResult.value) {
      const date = new Date(bucket.start_time * 1000).toISOString().slice(0, 10);
      const cost = bucket.results.reduce((sum, result) => sum + result.amount.value, 0);
      costUsd += cost;
      dailyCosts.set(date, (dailyCosts.get(date) ?? 0) + cost);
    }
  }

  const models = new Map<string, OrganizationUsage["models"][number]>();
  function getModel(name: string | null | undefined) {
    const model = name || "모델 정보 없음";
    const row = models.get(model) ?? { model, imageRequests: 0, completionRequests: 0, images: 0 };
    models.set(model, row);
    return row;
  }
  let images: number | null = null;
  let imageRequests: number | null = null;
  if (imageResult.status === "fulfilled") {
    images = 0;
    imageRequests = 0;
    for (const bucket of imageResult.value) {
      for (const result of bucket.results) {
        images += result.images;
        imageRequests += result.num_model_requests;
        const row = getModel(result.model);
        row.images += result.images;
        row.imageRequests += result.num_model_requests;
      }
    }
  }
  let completionRequests: number | null = null;
  if (completionResult.status === "fulfilled") {
    completionRequests = 0;
    for (const bucket of completionResult.value) {
      for (const result of bucket.results) {
        completionRequests += result.num_model_requests;
        getModel(result.model).completionRequests += result.num_model_requests;
      }
    }
  }

  return {
    ...range,
    fetchedAt: new Date().toISOString(),
    scope: config.projectIds.length ? "projects" : "organization",
    projectIds: config.projectIds,
    costUsd,
    images,
    imageRequests,
    completionRequests,
    dailyCosts: Array.from(dailyCosts, ([date, value]) => ({ date, costUsd: value })).sort((a, b) => a.date.localeCompare(b.date)),
    models: Array.from(models.values()).sort((a, b) => (b.imageRequests + b.completionRequests) - (a.imageRequests + a.completionRequests)),
    warnings,
  };
}

type CacheEntry = { expiresAt: number; result: Promise<OrganizationUsage> };
const cache = new Map<string, CacheEntry>();

export async function readOrganizationUsage(month: string): Promise<OrganizationUsage> {
  const range = resolveUsageRange(month);
  const config = configuration();
  const key = createHash("sha256").update(JSON.stringify([config.adminKey, config.projectIds, month])).digest("hex");
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  const result = fetchUsage(range, config);
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
  // Keep failures briefly too, so repeated refreshes do not amplify rate limiting.
  return result;
}

export function usageApiError(error: unknown): { body: UsageApiError; status: number } {
  const normalized = safeError(error);
  return { body: { code: normalized.code, error: normalized.message }, status: normalized.status };
}
