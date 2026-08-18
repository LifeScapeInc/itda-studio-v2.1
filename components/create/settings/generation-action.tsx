"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import styled from "styled-components";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useCreateStore } from "@/stores/useCreateStore";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import {
  getCutCount,
  getEstimatedCost,
  QUALITY_COST,
} from "@/system/create/generation-options";

const Footer = styled.footer`
  padding: var(--space-sm);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Cost = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
  color: var(--color-label-studio-comment);
  font-size: 12px;

  strong {
    color: var(--color-label-studio-black);
  }
`;

export function GenerationAction() {
  const state = useCreateStore();
  const mockMode = useAppSettingsStore((settings) => settings.mockMode);
  const spendTokens = useAppSettingsStore((settings) => settings.spendTokens);
  const cutCount = getCutCount(
    state.contentSet,
    state.freeCount,
    state.angleVariationIds,
  );
  const cost = getEstimatedCost(
    state.contentSet,
    state.freeCount,
    state.quality,
    state.angleVariationIds,
  );
  const canGenerate = Boolean(
    state.productImage
      && (state.contentSet || state.angleVariationIds.length > 0),
  );

  return (
    <Footer>
      <Cost>
        <span>예상 비용</span>
        <span>
          <strong>{cost.toLocaleString()}</strong>
          {" "}크레딧 · {cutCount}컷
        </span>
      </Cost>
      <PrimaryIconButton
        type="button"
        icon={state.isGenerating ? LoaderCircle : Sparkles}
        iconSize={17}
        iconClassName={state.isGenerating ? "animate-spin" : undefined}
        fullWidth
        height={48}
        labelClassName="type-xsmall-body"
        disabled={!canGenerate || state.isGenerating}
        onClick={() => {
          void state.requestGeneration(mockMode).then((result) => {
            if (result.usedActualGeneration) {
              spendTokens(
                result.actualCompleted * QUALITY_COST[state.quality],
              );
            }
          });
        }}
      >
        {state.isGenerating ? "생성 중..." : "생성하기"}
      </PrimaryIconButton>
    </Footer>
  );
}
