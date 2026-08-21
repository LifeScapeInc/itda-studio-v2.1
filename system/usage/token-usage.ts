export type TokenUsage = {
  total: number;
  inputText: number;
  inputImage: number;
  outputText: number;
  outputImage: number;
};

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  total: 0,
  inputText: 0,
  inputImage: 0,
  outputText: 0,
  outputImage: 0,
};

function tokenNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

export function addTokenUsage(
  ...items: Array<TokenUsage | undefined>
): TokenUsage {
  return items.reduce<TokenUsage>((total, item) => ({
    total: total.total + (item?.total ?? 0),
    inputText: total.inputText + (item?.inputText ?? 0),
    inputImage: total.inputImage + (item?.inputImage ?? 0),
    outputText: total.outputText + (item?.outputText ?? 0),
    outputImage: total.outputImage + (item?.outputImage ?? 0),
  }), { ...EMPTY_TOKEN_USAGE });
}

export function textResponseTokenUsage(usage: unknown): TokenUsage {
  const value = objectValue(usage);
  const input = tokenNumber(value.input_tokens);
  const output = tokenNumber(value.output_tokens);

  return {
    total: tokenNumber(value.total_tokens) || input + output,
    inputText: input,
    inputImage: 0,
    outputText: output,
    outputImage: 0,
  };
}

export function imageResponseTokenUsage(usage: unknown): TokenUsage {
  const value = objectValue(usage);
  const details = objectValue(value.input_tokens_details);
  const input = tokenNumber(value.input_tokens);
  const inputImage = tokenNumber(details.image_tokens);
  const detailedText = tokenNumber(details.text_tokens);
  const inputText = detailedText || Math.max(0, input - inputImage);
  const outputImage = tokenNumber(value.output_tokens);

  return {
    total: tokenNumber(value.total_tokens) || inputText + inputImage + outputImage,
    inputText,
    inputImage,
    outputText: 0,
    outputImage,
  };
}

export function hasTokenUsage(usage: TokenUsage | undefined): boolean {
  return Boolean(usage && usage.total > 0);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function dateKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isTokenUsage(value: unknown): value is TokenUsage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const usage = value as Partial<TokenUsage>;
  return [
    usage.total,
    usage.inputText,
    usage.inputImage,
    usage.outputText,
    usage.outputImage,
  ].every(item => typeof item === "number" && Number.isFinite(item));
}
