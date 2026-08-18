import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationRatio } from "@/system/create/generation-shots";

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
  usage?: Record<string, unknown>;
};

export type GenerationApiError = {
  error: string;
  code?: "AUTH_REQUIRED";
};
