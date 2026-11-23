"use client";

import { Bookmark, Download, Images, Info, X } from "lucide-react";
import { useState } from "react";
import styled from "styled-components";
import {
  downloadGenerationSet,
} from "@/system/create/download-images";
import type { LibraryGenerationShot } from "@/system/create/generation-library";
import { TooltipIconAction } from "@/components/ui/tooltip-icon-action";

const Actions = styled.div`
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
  align-items: center;
  gap: var(--space-2xs);
  overflow-x: auto;
  scrollbar-width: none;
`;

const ActionButton = styled(TooltipIconAction)<{ $active?: boolean }>`
  background: ${({ $active }) => $active
    ? "var(--color-main-neutral)"
    : "var(--color-surface)"};
  color: ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-label-studio-black)"};
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background: var(--color-main-neutral-light);
  }
`;

export function GeneratedNavigation({
  selectedShots,
  shots,
  setTitle,
  onSetBookmarks,
  onShowInfo,
  hasActiveHistory,
  closeDisabled,
  onClear,
  detailView = false,
}: {
  detailView?: boolean;
  hasActiveHistory: boolean;
  closeDisabled: boolean;
  onClear: () => void;
  selectedShots: LibraryGenerationShot[];
  shots: LibraryGenerationShot[];
  setTitle: string;
  onSetBookmarks: (shotIds: string[], bookmarked: boolean) => void;
  onShowInfo: (shots: LibraryGenerationShot[]) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const download = async (images: LibraryGenerationShot[]) => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError("");
    try { await downloadGenerationSet(images, setTitle); }
    catch (error) { setDownloadError(error instanceof Error ? error.message : "다운로드를 준비하지 못했습니다. 다시 시도해 주세요."); }
    finally { setDownloading(false); }
  };
  const downloadableShots = shots.filter(
    (shot) => shot.status === "done" && shot.imageUrl,
  );

  const allBookmarked = selectedShots.length > 0 && selectedShots.every(shot => shot.bookmarked);
  const multiple = selectedShots.length > 1;

  if (!downloadableShots.length && !hasActiveHistory) return null;

  return (
    <Actions>
      {!detailView && !multiple && downloadableShots.length > 0 && <ActionButton
        type="button"
        caption={downloading ? "다운로드 준비 중" : "전체 다운로드"}
        disabled={downloading}
        onClick={() => void download(downloadableShots)}
      >
        <Images size={14} />
      </ActionButton>}
      {selectedShots.length > 0 ? (
        <>
          <ActionButton
            type="button"
            caption={downloading ? "다운로드 준비 중" : multiple ? "선택한 이미지 다운로드" : "다운로드"}
            disabled={downloading}
            onClick={() => void download(selectedShots)}
          >
            <Download size={14} />
          </ActionButton>
          <ActionButton
            type="button"
            caption={allBookmarked ? "북마크 해제" : "북마크"}
            $active={allBookmarked}
            aria-pressed={allBookmarked}
            onClick={() => onSetBookmarks(selectedShots.map(shot => shot.id), !allBookmarked)}
          >
            <Bookmark
              size={14}
              fill={allBookmarked ? "currentColor" : "none"}
            />
          </ActionButton>
          <ActionButton
            type="button"
            caption="정보보기"
            aria-haspopup="dialog"
            onClick={() => onShowInfo(selectedShots)}
          >
            <Info size={14} />
          </ActionButton>
        </>
      ) : null}
      {hasActiveHistory && <ActionButton type="button" caption={detailView ? "목록으로 돌아가기" : "보기 닫기"} disabled={closeDisabled && !detailView} onClick={onClear}><X size={14} /></ActionButton>}
      {downloadError && <span role="alert" style={{ fontSize: 12 }}>{downloadError}</span>}
    </Actions>
  );
}
