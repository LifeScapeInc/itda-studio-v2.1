"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useCreateStore } from "@/stores/useCreateStore";
import { handleTabKeys } from "@/components/ui/workbench";
import styled from "styled-components";
import type { GenerationHistorySet } from "@/system/create/generation-library";
import { ItemHistory } from "./item-history";

const Area = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Header = styled.div`
  display: flex;
  height: 36px;
  flex: 0 0 36px;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  color: var(--color-label-studio-comment);

  h3 {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 6px;
    color: var(--color-label-studio-black);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-xs);
`;

const ProjectName = styled.span`
  max-width: 220px;
  color: var(--color-label-studio-comment);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-2xs);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-label-studio-comment);
  font-size: 11px;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--color-main-primary);
    color: var(--color-label-studio-black);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

const Scroll = styled.div`
  display: grid;
  min-width: 0;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(auto-fill, 188px);
  align-content: start;
  gap: var(--space-2xs);
  padding: 8px 12px 12px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Empty = styled.div`
  display: grid;
  width: 100%;
  min-height: 100%;
  grid-column: 1 / -1;
  place-items: center;
  color: var(--color-label-studio-comment);
`;

const Tabs = styled.div`display: flex; align-items: center; flex: 1; gap: 4px; min-width: 0;`;
const Tab = styled.button<{ $active: boolean }>`height: 28px; padding: 0 8px; border: 0; border-radius: 4px; background: ${({ $active }) => $active ? "var(--color-main-neutral-light)" : "transparent"}; color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"}; font-size: 13px; font-weight: ${({ $active }) => $active ? 500 : 400}; cursor: pointer;`;
const PromptInput = styled.textarea`flex: 1; min-height: 0; width: calc(100% - 24px); margin: 8px 12px 12px; padding: 12px; resize: none; border: 0; border-radius: 4px; background: var(--color-main-neutral-light); color: var(--color-label-studio-black); font: inherit; font-size: 13px; line-height: 1.7; &::placeholder { color: var(--color-label-studio-comment); }`;

export function GenerationHistoryGallery({
  history,
  projectName,
  activeHistoryId,
  deleteDisabled,
  onRestore,
  onDelete,
}: {
  history: GenerationHistorySet[];
  projectName?: string;
  activeHistoryId: string | null;
  deleteDisabled?: boolean;
  onRestore: (historyId: string) => void;
  onDelete: (historyId: string) => void;
}) {
  const [tab, setTab] = useState<"history" | "prompt">("history");
  const prompt = useCreateStore(s => s.prompt);
  const setPrompt = useCreateStore(s => s.setPrompt);
  const activeHistory = history.find(
    (historySet) => historySet.id === activeHistoryId,
  );

  const deleteActiveHistory = () => {
    if (!activeHistory) return;
    if (window.confirm(`‘${activeHistory.title}’ 이미지셋을 삭제할까요?`)) {
      onDelete(activeHistory.id);
    }
  };

  return (
    <Area aria-label="생성 히스토리">
      <Header>
        <Tabs role="tablist" aria-label="하단 작업 패널" onKeyDown={handleTabKeys}>
          <Tab type="button" role="tab" aria-selected={tab === "history"} $active={tab === "history"} onClick={() => setTab("history")}>히스토리</Tab>
          <Tab type="button" role="tab" aria-selected={tab === "prompt"} $active={tab === "prompt"} onClick={() => setTab("prompt")}>프롬프트</Tab>
          {projectName ? (
            <ProjectName className="type-xsmall-thin" title={projectName}>
              · {projectName}
            </ProjectName>
          ) : null}
        </Tabs>
        {tab === "history" && <HeaderActions>
          <span className="type-xsmall-thin">이미지셋 {history.length}개</span>
          <ActionButton
            type="button"
            disabled={!activeHistory || deleteDisabled}
            onClick={deleteActiveHistory}
          >
            <Trash2 size={13} />
            선택 삭제
          </ActionButton>
        </HeaderActions>}
      </Header>
      {tab === "prompt" ? <PromptInput aria-label="추가 디렉션 입력" placeholder="추가 디렉션 입력 (예: 조명을 더 밝게, 바닥을 우드톤으로)" value={prompt} onChange={event => setPrompt(event.target.value)} /> : <Scroll role="tabpanel" aria-label="히스토리">
        {history.length ? history.map((historySet) => (
          <ItemHistory
            historySet={historySet}
            active={historySet.id === activeHistoryId}
            onSelect={() => onRestore(historySet.id)}
            key={historySet.id}
          />
        )) : (
          <Empty>
            <span className="type-xsmall-thin">
              생성한 이미지셋이 여기에 쌓입니다.
            </span>
          </Empty>
        )}
      </Scroll>}
    </Area>
  );
}
