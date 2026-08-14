"use client";

import styled from "styled-components";
import type { GenerationShot } from "@/system/create/generation-shots";
import { GeneratedItem } from "./generated-item";

const Grid = styled.div`
  display: grid;
  width: min(100%, 940px);
  min-height: 100%;
  margin: 0 auto;
  padding: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-content: start;
  align-items: start;
  gap: var(--space-sm);
`;

export function GeneratedProgressGrid({
  shots,
  selectedShotId,
  onSelect,
  onOpenImage,
}: {
  shots: GenerationShot[];
  selectedShotId?: string | null;
  onSelect?: (shotId: string) => void;
  onOpenImage?: (shot: GenerationShot) => void;
}) {
  return (
    <Grid>
      {shots.map((shot) => (
        <GeneratedItem
          shot={shot}
          selected={shot.id === selectedShotId}
          onSelect={onSelect}
          onOpenImage={onOpenImage}
          key={shot.id}
        />
      ))}
    </Grid>
  );
}
