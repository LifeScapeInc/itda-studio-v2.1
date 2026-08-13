"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import styled from "styled-components";
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

const Generate = styled.button`
  display: flex;
  width: 100%;
  height: 48px;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  border: 0;
  border-radius: 8px;
  background: var(--color-main-primary);
  color: var(--color-surface);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-main-secondary);
  }

  &:disabled {
    background: var(--color-label-disabled);
    cursor: default;
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
      <Generate
        type="button"
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
        {state.isGenerating ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <Sparkles size={17} />
        )}
        <span className="type-xsmall-body">
          {state.isGenerating ? "생성 중..." : "생성하기"}
        </span>
      </Generate>
    </Footer>
  );
}
