"use client";

import { useState } from "react";
import { CircleCheck, LoaderCircle, RotateCcw, Sparkles, X } from "lucide-react";
import styled from "styled-components";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useCreateStore } from "@/stores/useCreateStore";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { getCutCount } from "@/system/create/generation-options";

const Footer = styled.footer`
  padding: var(--space-sm);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Summary = styled.div`
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

const Progress = styled.progress`
  display: block;
  width: 100%;
  height: 5px;
  margin-bottom: 10px;
  accent-color: var(--color-main-primary);
`;
const Retry = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 11px;
  cursor: pointer;
  &:disabled { opacity: .5; cursor: wait; }
`;
const Toast = styled.div`
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(540px, calc(100vw - 32px));
  padding: 13px 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-label-studio-black);
  background: var(--color-surface);
  box-shadow: 0 8px 30px #00000018;
  font-size: 12px;
  line-height: 1.5;
  svg { flex-shrink: 0; }
  button { border: 0; background: transparent; color: inherit; cursor: pointer; padding: 3px; }
`;

export function GenerationAction() {
  const state = useCreateStore();
  const mockMode = useAppSettingsStore((settings) => settings.mockMode);
  const [toastVisible, setToastVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const cutCount = getCutCount(
    state.contentSet,
    state.freeCount,
    state.angleVariationIds,
  );
  const completed = state.generationShots.filter(shot => shot.status === "done").length;
  const failed = state.generationShots.filter(shot => shot.status === "error").length;
  const total = state.generationShots.length;
  const canGenerate = Boolean(
    state.productImage
      && (state.contentSet || state.angleVariationIds.length > 0),
  );

  async function generate(retryFailed = false) {
    setResultMessage("");
    setToastVisible(true);
    try {
      const result = await state.requestGeneration(mockMode, retryFailed);
      setResultMessage(result.error ?? (result.failed > 0
        ? `${result.completed}장 완료 · ${result.failed}장 실패. 실패한 이미지만 다시 시도할 수 있어요.`
        : `${result.completed}장 ${result.usedActualGeneration ? "생성" : "미리보기"} 완료`));
    } catch {
      setResultMessage("생성 작업을 완료하지 못했습니다. 생성 결과를 확인하고 다시 시도해 주세요.");
    }
  }

  return (
    <Footer>
      <Summary>
        <span>{state.isGenerating ? "이미지 생성 중" : mockMode ? "미리보기 모드" : "생성할 이미지"}</span>
        <strong>{state.isGenerating ? `${completed} / ${total}장 완료${failed ? ` · ${failed}장 실패` : ""}` : cutCount ? `${cutCount}장` : "방식 미선택"}</strong>
      </Summary>
      {state.isGenerating ? <Progress aria-label="이미지 생성 진행률" max={Math.max(1, total)} value={completed + failed} /> : null}
      <PrimaryIconButton
        type="button"
        icon={state.isGenerating ? LoaderCircle : Sparkles}
        iconSize={17}
        iconClassName={state.isGenerating ? "animate-spin" : undefined}
        fullWidth
        height={48}
        labelClassName="type-xsmall-body"
        disabled={!canGenerate || state.isGenerating}
        onClick={() => void generate()}
      >
        {state.isGenerating ? "생성 중..." : cutCount ? `${cutCount}장 생성하기` : "생성 방식 선택"}
      </PrimaryIconButton>
      {failed > 0 ? <Retry type="button" disabled={state.isGenerating} onClick={() => void generate(true)}><RotateCcw size={13} />실패한 {failed}장만 다시 시도</Retry> : null}
      {toastVisible ? <Toast role="status" aria-live="polite">
        {state.isGenerating ? <LoaderCircle size={16} className="animate-spin" /> : <CircleCheck size={16} />}
        <span>{state.isGenerating ? state.generationMessage : resultMessage || state.generationMessage}</span>
        <button type="button" aria-label="생성 알림 닫기" onClick={() => setToastVisible(false)}><X size={15} /></button>
      </Toast> : null}
    </Footer>
  );
}
