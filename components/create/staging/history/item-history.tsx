"use client";

import { EditableTitle } from "@/components/ui/editable-title";
import { useCreateStore } from "@/stores/useCreateStore";
import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import type { GenerationHistorySet } from "@/system/create/generation-library";

const Card = styled.div<{ $active: boolean }>`
  display: flex;
  width: 188px;
  height: 132px;
  flex: 0 0 188px;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 6px;
  background: ${({ $active }) => $active
    ? "var(--color-main-neutral-light)"
    : "var(--color-surface)"};
  color: inherit;
  cursor: pointer;
  text-align: left;


`;

const Preview = styled.span`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
`;

const PreviewImage = styled.span`
  position: relative;
  min-width: 0;
  border-radius: 5px;
  background: var(--color-main-neutral);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

const Copy = styled.span`
  --editable-title-height: 20px;
  display: flex;
  min-width: 0;
  justify-content: space-between;
  gap: 4px;
  font-size: 11px;

  strong {
    font-weight: 500;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  time {
    flex: 0 0 auto;
    color: var(--color-label-studio-comment);
  }
`;

export function ItemHistory({
  historySet,
  active,
  onSelect,
}: {
  historySet: GenerationHistorySet;
  active: boolean;
  onSelect: () => void;
}) {
  const renameHistory = useCreateStore(s => s.renameHistory);
  const previewShots = historySet.shots
    .filter((shot) => shot.imageUrl)
    .slice(0, 3);

  return (
    <Card
      role="button"
      tabIndex={0}
      $active={active}
      aria-pressed={active}
      onKeyDown={event => { if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) { event.preventDefault(); onSelect(); } }}
      aria-label={`${historySet.title} 이미지셋 복원`}
      onClick={onSelect}
    >
      <Preview>
        {previewShots.length ? previewShots.map((shot) => (
          <PreviewImage key={shot.id}>
            <LoadingImage
              src={shot.imageUrl!}
              alt=""
              fill
              unoptimized
              sizes="54px"
            />
          </PreviewImage>
        )) : <PreviewImage />}
      </Preview>
      <Copy>
        <strong><EditableTitle label="히스토리 제목" value={historySet.title} onSave={title => renameHistory(historySet.id, title)} /></strong>
        <time>
          {new Date(historySet.createdAt).toLocaleDateString(
            "ko-KR",
            { month: "numeric", day: "numeric" },
          )}
        </time>
      </Copy>
    </Card>
  );
}
