"use client";

import styled from "styled-components";
import { MoodboardCollage } from "@/components/moodboard/moodboard-collage";
import { ReferenceDetailTitle } from "@/components/references/reference-detail-title";
import { ButtonBack } from "@/components/ui/button-back";
import type { MoodboardLayoutManifest } from "@/system/moodboard/moodboard-layout";
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

export function MoodboardDetail({
  moodboard,
  manifest,
}: {
  moodboard: Moodboard;
  manifest: MoodboardLayoutManifest;
}) {
  return (
    <Root>
      <ButtonBack href="/moodboard" label="무드보드 목록" />
      <ReferenceDetailTitle
        title={moodboard.name}
        description={moodboard.description}
      />
      <Area>
        <MoodboardCollage
          manifest={manifest}
          styleName={moodboard.name}
        />
      </Area>
    </Root>
  );
}
