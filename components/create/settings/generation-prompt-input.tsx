"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);

  label { font-size: 12px; font-weight: 700; }
  p { margin: 0; color: var(--color-label-studio-comment); font-size: 11px; line-height: 1.45; }
`;

const Prompt = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-black);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  outline: none;

  &:focus { border-color: var(--color-main-primary); }
`;

export function GenerationPromptInput() {
  const prompt = useCreateStore(state => state.prompt);
  const setPrompt = useCreateStore(state => state.setPrompt);
  return (
    <Card>
      <label htmlFor="generation-extra-prompt">추가 프롬프트</label>
      <Prompt
        id="generation-extra-prompt"
        value={prompt}
        placeholder="예) 조명을 더 밝게, 바닥을 우드톤으로"
        onChange={event => setPrompt(event.target.value)}
      />
      <p>제품의 원형은 유지한 채, 이 요청을 선택한 모든 컷에 적용합니다.</p>
    </Card>
  );
}
