"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Bookmark, ImageIcon, X } from "lucide-react";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { useCreateStore } from "@/stores/useCreateStore";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import {
  BOOKMARK_DETAILS_PANEL_MAX_WIDTH,
  BOOKMARK_DETAILS_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";
import {
  getBookmarkedImages,
  type LibraryGenerationShot,
} from "@/system/create/generation-library";
import { StudioShell } from "@/system/styles/layout";
import { ItemBookmark } from "./item-bookmark";

const Workspace = styled.main`
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: var(--navigation-left-width, 203px);
  padding-top: 56px;
  background: var(--color-main-neutral-light);
  overflow: hidden;
  transition: margin-left 220ms ease;
`;

const Content = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: var(--space-3xl) var(--space-2xl) var(--space-lg);
  overflow: hidden;
`;

const Grid = styled.section`
  display: grid;
  min-height: 0;
  flex: 1;
  margin-top: var(--space-xl);
  padding-block: var(--space-3xs);
  grid-template-columns: repeat(auto-fill, minmax(280px, 336px));
  align-content: start;
  gap: var(--space-lg);
  overflow-y: auto;
`;

const Details = styled.aside<{ $width: number }>`
  position: relative;
  display: flex;
  width: ${({ $width }) => $width}px;
  min-height: 0;
  flex: 0 0 ${({ $width }) => $width}px;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
`;

const DetailHeader = styled.div`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-sm);
  border-bottom: 1px solid var(--color-border);

  button {
    border: 0;
    background: transparent;
    cursor: pointer;
  }
`;

const DetailPreview = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--color-main-neutral);

  img {
    object-fit: contain;
  }
`;

const DetailBody = styled.div`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const MetadataColumn = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
`;

const Metadata = styled.dl`
  display: grid;
  min-height: 0;
  flex: 1;
  margin: 0;
  padding: var(--space-sm);
  grid-template-columns: 92px minmax(0, 1fr);
  align-content: start;
  gap: var(--space-xs) var(--space-2xs);
  overflow-y: auto;
  font-size: 12px;

  dt {
    color: var(--color-label-studio-comment);
  }

  dd {
    margin: 0;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
`;

const Remove = styled.button`
  height: 40px;
  margin: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: pointer;
`;

const Empty = styled.div`
  display: flex;
  min-height: 280px;
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
`;

function MetadataList({ shot }: { shot: LibraryGenerationShot }) {
  const metadata = shot.metadata;
  const entries = [
    ["최종 프롬프트", metadata.finalPrompt],
    ["생성 시각", new Date(metadata.generatedAt).toLocaleString("ko-KR")],
    ["AI 모델", metadata.aiModel],
    ["생성 종류", metadata.variationType],
    ["품질", metadata.quality],
    ["AI 편집", metadata.editMode || "기본"],
    ["채광/시간대", metadata.light],
    ["인테리어 무드", metadata.mood],
    ["연출 소품", metadata.props.length ? metadata.props.join(", ") : "없음"],
    ["추가 디렉션", metadata.additionalDirection || "없음"],
    ["이미지 크기", metadata.imageSize],
  ];

  return (
    <Metadata>
      {entries.map(([label, value]) => (
        <div style={{ display: "contents" }} key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </Metadata>
  );
}

export function BookmarksWorkspace() {
  const history = useCreateStore((state) => state.generationHistory);
  const hydrateLibrary = useCreateStore((state) => state.hydrateLibrary);
  const toggleBookmark = useCreateStore((state) => state.toggleBookmark);
  const detailsPanelWidth = useWorkspaceLayoutStore(
    (state) => state.bookmarkDetailsPanelWidth,
  );
  const resizeDetailsPanel = useWorkspaceLayoutStore(
    (state) => state.resizeBookmarkDetailsPanel,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bookmarks = getBookmarkedImages(history);
  const selected = bookmarks.find((shot) => shot.id === selectedId) ?? null;

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        <Content>
          <LabelTitle
            title="북마크"
            description="생성 결과에서 저장한 이미지와 생성 메타데이터를 한곳에서 확인합니다."
          />
          <Grid aria-label="북마크 이미지 목록">
            {bookmarks.length ? bookmarks.map((shot) => (
              <ItemBookmark
                shot={shot}
                active={shot.id === selectedId}
                onClick={() => setSelectedId(shot.id)}
                key={shot.id}
              />
            )) : (
              <Empty>
                <ImageIcon size={40} strokeWidth={1.3} />
                <strong>북마크한 이미지가 없습니다.</strong>
                <span className="type-xsmall-thin">
                  생성 결과에서 이미지를 선택한 뒤 북마크해 보세요.
                </span>
              </Empty>
            )}
          </Grid>
        </Content>
        <Details $width={detailsPanelWidth}>
          <PanelResizeHandle
            edge="left"
            label="북마크 상세 너비 조절"
            value={detailsPanelWidth}
            minimum={BOOKMARK_DETAILS_PANEL_MIN_WIDTH}
            maximum={BOOKMARK_DETAILS_PANEL_MAX_WIDTH}
            onResize={resizeDetailsPanel}
          />
          {selected ? (
            <>
              <DetailHeader>
                <strong>{selected.label}</strong>
                <button
                  type="button"
                  aria-label="상세 닫기"
                  onClick={() => setSelectedId(null)}
                >
                  <X size={17} />
                </button>
              </DetailHeader>
              <DetailBody>
              <DetailPreview>
                <Image
                  src={selected.imageUrl!}
                  alt={selected.label}
                  fill
                  unoptimized
                  sizes={`${Math.round(detailsPanelWidth / 2)}px`}
                />
              </DetailPreview>
                <MetadataColumn>
                  <MetadataList shot={selected} />
                  <Remove
                    type="button"
                    onClick={() => {
                      toggleBookmark(selected.id);
                      setSelectedId(null);
                    }}
                  >
                    북마크 해제
                  </Remove>
                </MetadataColumn>
              </DetailBody>
            </>
          ) : (
            <Empty>
              <Bookmark size={30} strokeWidth={1.3} />
              <span className="type-xsmall-thin">
                이미지를 선택하면 원본 이미지와 메타데이터를 표시합니다.
              </span>
            </Empty>
          )}
        </Details>
      </Workspace>
    </StudioShell>
  );
}
