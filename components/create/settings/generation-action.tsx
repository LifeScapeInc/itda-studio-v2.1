"use client";

import styled from "styled-components";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useCreateStore } from "@/stores/useCreateStore";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { getBatchCount } from "@/system/create/generation-batch";

const Footer = styled.footer`
  padding: var(--space-sm);
  border-top: 0;
  background: var(--color-surface);
  border-radius: 0 0 var(--radius-panel) var(--radius-panel);
`;

export function GenerationAction() {
  const state = useCreateStore();
  const mockMode = useAppSettingsStore((settings) => settings.mockMode);
  const cutCount = getBatchCount(state.batchEntries);
  const canGenerate = Boolean(
    state.productImage
      && cutCount > 0,
  );

  return (
    <Footer>
      <PrimaryIconButton
        type="button"
        fullWidth
        height={42}
        labelClassName="type-xsmall-body"
        disabled={!canGenerate || state.isGenerating}
        onClick={() => void state.requestGeneration(mockMode)}
      >
        {state.isGenerating ? "생성 중..." : "생성하기"}
      </PrimaryIconButton>
    </Footer>
  );
}

export function RegenerationAction() {
  const selectedId = useCreateStore(state => state.selectedShotId);
  const selected = useCreateStore(state => state.generationShots.find(shot => shot.id === selectedId));
  const retryShot = useCreateStore(state => state.retryShot);
  const mockMode = useAppSettingsStore(state => state.mockMode);
  const canRegenerate = selected?.status === "done" && Boolean(selected.imageUrl);
  return <Footer><PrimaryIconButton type="button" fullWidth height={42} labelClassName="type-xsmall-body"
    disabled={!canRegenerate} onClick={() => { if (selectedId) void retryShot(selectedId, mockMode, true); }}>
    {selected?.status === "generating" ? "재생성 중..." : "재생성"}
  </PrimaryIconButton></Footer>;
}
