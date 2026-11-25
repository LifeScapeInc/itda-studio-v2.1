import { notFound } from "next/navigation";
import { FurnitureCategoryWorkspace } from "@/components/furniture/furniture-category-workspace";
import {
  getFurnitureCategory,
} from "@/system/furniture/furniture-catalog";


export default async function FurnitureCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getFurnitureCategory(slug);

  if (!category) {
    notFound();
  }

  return <FurnitureCategoryWorkspace category={category} />;
}
