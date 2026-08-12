import { notFound } from "next/navigation";
import { FurnitureViewer } from "@/components/furniture/furniture-viewer";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import {
  FURNITURE_CATEGORIES,
  getFurnitureCategory,
} from "@/system/furniture/furniture-catalog";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";

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

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <FurnitureViewer category={category} />
      </WorkspaceContent>
    </StudioShell>
  );
}
