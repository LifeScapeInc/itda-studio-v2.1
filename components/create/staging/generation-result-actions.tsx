"use client";

import { Bookmark, Download, Images, Info } from "lucide-react";
import styled from "styled-components";
import {
  downloadGenerationImage,
  downloadGenerationSet,
} from "@/system/create/download-images";
import type { LibraryGenerationShot } from "@/system/create/generation-library";

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2xs);
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  padding: 0 var(--space-xs);
  border: 1px solid ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $active }) => $active
    ? "var(--color-main-tertiary)"
    : "var(--color-surface)"};
  color: ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-label-studio-black)"};
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--color-main-primary);
  }
`;

export function GenerationResultActions({
  selectedShot,
  shots,
  setTitle,
  onToggleBookmark,
  onShowInfo,
}: {
  selectedShot?: LibraryGenerationShot;
  shots: LibraryGenerationShot[];
  setTitle: string;
  onToggleBookmark: (shotId: string) => void;
  onShowInfo: (shot: LibraryGenerationShot) => void;
}) {
  const downloadableShots = shots.filter(
    (shot) => shot.status === "done" && shot.imageUrl,
  );

  if (!downloadableShots.length) return null;

  return (
    <Actions>
      <ActionButton
        type="button"
        title="현재 이미지셋의 완료된 이미지를 모두 다운로드"
        onClick={() => downloadGenerationSet(downloadableShots, setTitle)}
      >
        <Images size={14} />
        전체 다운로드
      </ActionButton>
      {selectedShot ? (
        <>
          <ActionButton
            type="button"
            onClick={() => downloadGenerationImage(selectedShot)}
          >
            <Download size={14} />
            다운로드
          </ActionButton>
          <ActionButton
            type="button"
            $active={selectedShot.bookmarked}
            aria-pressed={selectedShot.bookmarked}
            onClick={() => onToggleBookmark(selectedShot.id)}
          >
            <Bookmark
              size={14}
              fill={selectedShot.bookmarked ? "currentColor" : "none"}
            />
            {selectedShot.bookmarked ? "북마크됨" : "북마크"}
          </ActionButton>
          <ActionButton
            type="button"
            aria-haspopup="dialog"
            onClick={() => onShowInfo(selectedShot)}
          >
            <Info size={14} />
            정보보기
          </ActionButton>
        </>
      ) : null}
    </Actions>
  );
}
