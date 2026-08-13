import { notFound } from "next/navigation";
import { FurnitureCategoryWorkspace } from "@/components/furniture/furniture-category-workspace";
import {
  FURNITURE_CATEGORIES,
  getFurnitureCategory,
} from "@/system/furniture/furniture-catalog";

export function generateStaticParams() {
  return FURNITURE_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export default async function FurnitureCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getFurnitureCategory(slug);

  if (!category) {
    notFound();
  }

  return <FurnitureCategoryWorkspace category={category} />;
}
