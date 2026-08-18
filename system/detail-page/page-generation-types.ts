import type {
  DetailTile,
  DetailTileType,
  ProcessedPlanningInput,
} from "@/system/detail-page/detail-page-types";

export type GeneratedTextAlign = "left" | "center";
export type GeneratedTextPlacement = "top" | "bottom" | "left" | "right";
export type GeneratedMediaLayout =
  | "none"
  | "single"
  | "row"
  | "column"
  | "grid"
  | "split-left"
  | "split-right";

export type GeneratedPageImage = {
  id: string;
  url: string;
  alt: string;
  aspectRatio: "1:1" | "3:4" | "4:5" | "16:9";
};

export type GeneratedPageTile = {
  id: string;
  sourceTileId: string;
  type: DetailTileType;
  title: string;
  body: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  textAlign: GeneratedTextAlign;
  textPlacement: GeneratedTextPlacement;
  textWidth: number;
  titleSize: number;
  bodySize: number;
  titleWeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  gap: number;
  mediaLayout: GeneratedMediaLayout;
  mediaWidthPercent: number;
  images: GeneratedPageImage[];
};

export type GeneratedDetailPage = {
  width: 860;
  tiles: GeneratedPageTile[];
};

export type PageGenerationRequest = {
  furnitureImage: string | null;
  planningInput: ProcessedPlanningInput | null;
  tiles: DetailTile[];
  mockMode: boolean;
};

export type PageGenerationResponse = {
  mock: boolean;
  page: GeneratedDetailPage;
  note: string;
  metadata?: {
    layoutModel?: string;
    imageModel?: string;
  };
};
