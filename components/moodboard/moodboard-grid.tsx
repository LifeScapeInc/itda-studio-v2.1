"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";
import { ItemReferences } from "@/components/references/item-references";
import { LabelTitle } from "@/components/ui/label-title";
import { MOODBOARDS } from "@/system/moodboard/moodboards";
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

export function MoodboardGrid() {
  const router = useRouter();

  return (
    <>
      <LabelTitle
        title="인테리어 무드보드"
        description="레퍼런스 이미지를 컨셉 단위로 묶어, 클릭 한 번에 다양한 스타일의 이미지를 볼 수 있습니다."
      />
      <Scroll>
        <Grid aria-label="무드보드 스타일 목록">
          {MOODBOARDS.map((moodboard) => (
            <ItemReferences
              title={moodboard.name}
              description={moodboard.description}
              previewImages={moodboard.previewImages}
              ariaLabel={`${moodboard.name} 무드보드 보기`}
              onClick={() => router.push(`/moodboard/${moodboard.slug}`)}
              key={moodboard.slug}
            />
          ))}
        </Grid>
      </Scroll>
    </>
  );
}
