import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";
import type { TokenUsage } from "@/system/usage/token-usage";

export type GenerationApiRequest = {
  productImage: string;
  referenceImages?: string[];
  prompt: string;
  quality: GenerationQuality;
  ratio: GenerationRatio;
  mockMode?: boolean;
};

export type GenerationApiResponse = {
  mock: boolean;
  prompt: string;
  images: string[];
  note: string;
  tokenUsage?: TokenUsage;
};

export type GenerationApiError = {
  error: string;
  code?: "AUTH_REQUIRED";
};
