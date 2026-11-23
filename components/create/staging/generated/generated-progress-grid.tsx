"use client";

import styled from "styled-components";
import type { GenerationShot } from "@/system/create/generation-shots";
import { GeneratedItem } from "./generated-item";

const Grid = styled.div`
  display: grid;
  width: 100%;
  min-height: 100%;
  margin: 0 auto;
  padding: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  align-content: start;
  align-items: start;
  gap: var(--space-sm);
`;

export function GeneratedProgressGrid({
  shots,
  selectedShotIds,
  onSelect,
  onOpenImage,
  onRetry,
  retryDisabled = false,
}: {
  shots: GenerationShot[];
  selectedShotIds: string[];
  onSelect?: (shotId: string, modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => void;
  onOpenImage?: (shot: GenerationShot) => void;
  onRetry?: (shotId: string) => void;
  retryDisabled?: boolean;
}) {
  return (
    <Grid>
      {shots.map((shot) => (
        <GeneratedItem
          shot={shot}
          selected={selectedShotIds.includes(shot.id)}
          onSelect={onSelect}
          onOpenImage={onOpenImage}
          onRetry={onRetry}
          retryDisabled={retryDisabled}
          key={shot.id}
        />
      ))}
    </Grid>
  );
}
