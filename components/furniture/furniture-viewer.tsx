"use client";

import styled from "styled-components";
import { ImageAlbum } from "@/components/references/image-album";
import { LibraryDetailHeader } from "@/components/references/library-detail-header";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";

const Content = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  padding: 24px 28px 28px;
  background: var(--color-background-workspace);
  overflow: hidden;
`;

const AlbumArea = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  border-radius: var(--radius-panel);
  overflow: hidden;
`;

export function FurnitureViewer({
  category,
  selectedIndex,
  onIndexChange,
}: {
  category: FurnitureCategory;
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const description = `${category.images.length}장의 이미지`;

  return (
    <Content>
      <LibraryDetailHeader href="/furniture" backLabel="가구 목록"
        title={category.name}
        description={description}
      />
      <AlbumArea>
        <ImageAlbum
          images={category.images}
          name={category.name}
          selectedIndex={selectedIndex}
          onIndexChange={onIndexChange}
          showFooter={false}
          emptyDescription="이 가구 종류의 레퍼런스가 추가되면 여기에 표시됩니다."
        />
      </AlbumArea>
    </Content>
  );
}
