"use client";

import { useState } from "react";
import styled from "styled-components";
import { FurnitureGalleryPanel } from "@/components/furniture/furniture-gallery-panel";
import { FurnitureViewer } from "@/components/furniture/furniture-viewer";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";
import { StudioShell } from "@/system/styles/layout";

const Workspace = styled.main`
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: var(--navigation-left-width, 203px);
  padding-top: 56px;
  overflow: hidden;
  background: var(--color-main-neutral-light);
  transition: margin-left 220ms ease;
`;

export function FurnitureCategoryWorkspace({
  category,
}: {
  category: FurnitureCategory;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        <FurnitureViewer
          category={category}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
        />
        <FurnitureGalleryPanel
          images={category.images}
          name={category.name}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </Workspace>
    </StudioShell>
  );
}
