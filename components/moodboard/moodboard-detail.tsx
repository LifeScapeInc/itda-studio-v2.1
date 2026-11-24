"use client";

import styled from "styled-components";
import { MoodboardCollage } from "@/components/moodboard/moodboard-collage";
import { LibraryDetailHeader } from "@/components/references/library-detail-header";
import type { MoodboardLayoutManifest } from "@/system/moodboard/moodboard-layout";
import type { Moodboard } from "@/system/moodboard/moodboards";

const Root = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  padding: 24px 28px 28px;
  background: var(--color-background-workspace);
  flex-direction: column;
  gap: var(--space-sm);
`;

const Area = styled.div`
  position: relative;
  min-height: 0;
  flex: 1;
  background: var(--color-background-workspace);
  border-radius: var(--radius-panel);
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
      <LibraryDetailHeader href="/moodboard" backLabel="무드보드 목록"
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
