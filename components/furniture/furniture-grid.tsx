"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { ItemReferences } from "@/components/references/item-references";
import { LabelTitle } from "@/components/ui/label-title";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";
import { HiddenScrollbar } from "@/system/styles/layout";

const Scroll = styled(HiddenScrollbar)`
  min-height: 0;
  flex: 1;
  margin-top: var(--space-3xl);
  padding-block: var(--space-3xs);
  overflow-y: auto;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 336px));
  align-content: start;
  gap: var(--space-lg);

  @media (max-width: 1180px) {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }
`;

export function FurnitureGrid({
  categories,
}: {
  categories: FurnitureCategory[];
}) {
  const router = useRouter();

  return (
    <>
      <LabelTitle
        title="가구 스튜디오 컷"
        description="가구의 종류별로 하이엔드 연출 컷을 둘러볼 수 있습니다."
      />
      <Scroll>
        <Grid aria-label="가구 레퍼런스 목록">
          {categories.map((category) => (
            <ItemReferences
              title={category.name}
              description={`${category.images.length}장의 이미지`}
              previewImages={category.previewImages}
              ariaLabel={`${category.name} 레퍼런스 보기`}
              onClick={() => router.push(`/furniture/${category.slug}`)}
              key={category.slug}
            />
          ))}
        </Grid>
      </Scroll>
    </>
  );
}
