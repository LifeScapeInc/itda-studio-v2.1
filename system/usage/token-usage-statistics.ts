import {
  addTokenUsage,
  EMPTY_TOKEN_USAGE,
  type TokenUsage,
  type TokenUsageContext,
  type TokenUsageRecord,
} from "@/system/usage/token-usage";

export type TokenUsageAverage = {
  context: TokenUsageContext;
  count: number;
  average: TokenUsage;
};

function averageUsage(usage: TokenUsage, count: number): TokenUsage {
  const divisor = Math.max(1, count);
  return {
    total: Math.round(usage.total / divisor),
    inputText: Math.round(usage.inputText / divisor),
    inputImage: Math.round(usage.inputImage / divisor),
    outputText: Math.round(usage.outputText / divisor),
    outputImage: Math.round(usage.outputImage / divisor),
  };
}

export function usageAverages(
  records: TokenUsageRecord[],
): TokenUsageAverage[] {
  const grouped = new Map<
    string,
    { context: TokenUsageContext; count: number; usage: TokenUsage }
  >();

  records.forEach((record) => {
    const current = grouped.get(record.context.key);
    grouped.set(record.context.key, {
      context: record.context,
      count: (current?.count ?? 0) + 1,
      usage: addTokenUsage(current?.usage ?? EMPTY_TOKEN_USAGE, record.usage),
    });
  });

  return Array.from(grouped.values())
    .map(group => ({
      context: group.context,
      count: group.count,
      average: averageUsage(group.usage, group.count),
    }))
    .sort((left, right) => (
      right.count - left.count
      || right.average.total - left.average.total
      || left.context.label.localeCompare(right.context.label, "ko")
    ));
}
