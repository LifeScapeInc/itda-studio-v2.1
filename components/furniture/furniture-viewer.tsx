"use client";

import styled from "styled-components";
import { ImageAlbum } from "@/components/references/image-album";
import { ReferenceDetailTitle } from "@/components/references/reference-detail-title";
import { ButtonBack } from "@/components/ui/button-back";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";

const Content = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  padding: 48px var(--space-2xl) var(--space-2xl);
  background: var(--color-main-neutral-light);
  overflow: hidden;
`;

const AlbumArea = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
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
      <ButtonBack href="/furniture" label="가구 목록" />
      <ReferenceDetailTitle
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
