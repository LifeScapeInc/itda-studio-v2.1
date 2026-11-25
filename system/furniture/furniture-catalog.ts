import { cloudFurniture } from "@/system/server/cloud-catalog";
import type { ReferenceItemData } from "@/system/references/reference-types";

export type FurnitureCategory = ReferenceItemData & {
  images: string[];
};

type FurnitureCategoryMeta = {
  slug: string;
  name: string;
  description: string;
};

export const FURNITURE_CATEGORIES: FurnitureCategoryMeta[] = [
  {
    slug: "sofas",
    name: "소파",
    description: "다양한 형태와 소재의 소파 레퍼런스",
  },
  {
    slug: "chairs-stools",
    name: "의자 · 스툴",
    description: "체어와 스툴 중심의 가구 레퍼런스",
  },
  {
    slug: "beds",
    name: "침대",
    description: "침실 연출과 침대 디자인 레퍼런스",
  },
  {
    slug: "tables",
    name: "테이블",
    description: "다이닝과 사이드 테이블 레퍼런스",
  },
  {
    slug: "tv-stands",
    name: "거실장 · TV장",
    description: "거실 수납과 TV장 레퍼런스",
  },
  {
    slug: "storage-cabinets",
    name: "서랍 · 수납장",
    description: "서랍장과 수납 가구 레퍼런스",
  },
  {
    slug: "racks",
    name: "행거",
    description: "행거와 오픈형 수납 레퍼런스",
  },
];

export async function getFurnitureCategories():Promise<FurnitureCategory[]>{return cloudFurniture();}
export async function getFurnitureCategory(slug:string):Promise<FurnitureCategory|undefined>{return (await cloudFurniture()).find(c=>c.slug===slug);}
