import { FurnitureGrid } from "@/components/furniture/furniture-grid";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { getFurnitureCategories } from "@/system/furniture/furniture-catalog";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";

export default async function FurniturePage() {
  const categories = await getFurnitureCategories();

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <FurnitureGrid categories={categories} />
      </WorkspaceContent>
    </StudioShell>
  );
}
