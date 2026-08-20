"use client";

import styled from "styled-components";
import { MoodboardDetailViewer } from "@/components/moodboard/moodboard-detail-viewer";
import { ReferenceDetailTitle } from "@/components/references/reference-detail-title";
import { ButtonBack } from "@/components/ui/button-back";
import { LoadingImage } from "@/components/ui/loading-image";
import type { Moodboard } from "@/system/moodboard/moodboards";

const Root = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
`;

const Area = styled.div`
  position: relative;
  min-height: 0;
  flex: 1;
  background: white;
  overflow: hidden;
`;

const Figure = styled.figure`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin: 0;
  background: white;
  overflow: hidden;
`;

export function MoodboardDetail({
  moodboard,
  images,
}: {
  moodboard: Moodboard;
  images: string[];
}) {
  return (
    <Root>
      <ButtonBack href="/moodboard" label="무드보드 목록" />
      <ReferenceDetailTitle
        title={moodboard.name}
        description={moodboard.description}
      />
      <Area>
        <Figure>
          <LoadingImage
            src={moodboard.renderImage}
            alt={`${moodboard.name} 스타일 무드보드`}
            fill
            priority
            sizes="calc(100vw - 275px)"
            style={{ objectFit: "contain", background: "white" }}
          />
        </Figure>
        <MoodboardDetailViewer
          images={images}
          name={moodboard.name}
        />
      </Area>
    </Root>
  );
}
