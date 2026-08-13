"use client";

import { History, Trash2 } from "lucide-react";
import styled from "styled-components";
import type { GenerationHistorySet } from "@/system/create/generation-library";
import { ItemHistory } from "./item-history";

const Area = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface);
  overflow: auto;
  scrollbar-width: thin;
`;

const Header = styled.div`
  display: flex;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  color: var(--color-label-studio-comment);

  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-label-studio-black);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const DeleteButton = styled.button`
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
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  align-items: flex-start;
  gap: var(--space-2xs);
  padding: 0 var(--space-md) var(--space-xs);
  overflow: auto;
  scrollbar-width: thin;
`;

const Empty = styled.div`
  display: grid;
  min-width: 240px;
  min-height: 100%;
  flex: 1;
  place-items: center;
  color: var(--color-label-studio-comment);
`;

export function GenerationHistoryGallery({
  history,
  activeHistoryId,
  deleteDisabled,
  onRestore,
  onDelete,
}: {
  history: GenerationHistorySet[];
  activeHistoryId: string | null;
  deleteDisabled?: boolean;
  onRestore: (historyId: string) => void;
  onDelete: (historyId: string) => void;
}) {
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
        <h3 className="type-xsmall-body">
          <History size={15} />
          히스토리
        </h3>
        <HeaderActions>
          <span className="type-xsmall-thin">이미지셋 {history.length}개</span>
          <DeleteButton
            type="button"
            disabled={!activeHistory || deleteDisabled}
            onClick={deleteActiveHistory}
          >
            <Trash2 size={13} />
            선택 삭제
          </DeleteButton>
        </HeaderActions>
      </Header>
      <Scroll>
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
      </Scroll>
    </Area>
  );
}
