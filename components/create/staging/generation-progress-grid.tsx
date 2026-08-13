"use client";

import styled from "styled-components";
import type { GenerationShot } from "@/system/create/generation-shots";
import { ItemGeneration } from "./item-generation";

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

export function GenerationProgressGrid({
  shots,
  selectedShotId,
  onSelect,
}: {
  shots: GenerationShot[];
  selectedShotId?: string | null;
  onSelect?: (shotId: string) => void;
}) {
  return (
    <Grid>
      {shots.map((shot) => (
        <ItemGeneration
          shot={shot}
          selected={shot.id === selectedShotId}
          onSelect={onSelect}
          key={shot.id}
        />
      ))}
    </Grid>
  );
}
