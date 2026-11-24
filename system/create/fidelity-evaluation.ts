export type FidelityEvaluation =
  | { status: "scored"; score: number; modelVersion: string }
  | { status: "unavailable"; reason: string }
  | { status: "not_applicable"; reason: string };
