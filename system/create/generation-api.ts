import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";
import type { TokenUsage } from "@/system/usage/token-usage";
import type { FidelityEvaluation } from "./fidelity-evaluation";

export type GenerationApiRequest = {
  productImage: string;
  referenceImages?: string[];
  prompt: string;
  quality: GenerationQuality;
  ratio: GenerationRatio;
  mockMode?: boolean;
  brandId?: string | null;
};

export type GenerationApiResponse = {
  mock: boolean;
  prompt: string;
  images: string[];
  fidelityEvaluations?: FidelityEvaluation[];
  brandFitEvaluations?: FidelityEvaluation[];
  note: string;
  tokenUsage?: TokenUsage;
  metadata?: {
    model: string;
  };
};

export type GenerationApiError = {
  error: string;
  code?: "AUTH_REQUIRED";
};
