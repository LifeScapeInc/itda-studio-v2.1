"use client";

import { Download, LoaderCircle, PanelsTopLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import {
  exportGeneratedDetailPage,
  type DetailPageExportFormat,
} from "@/system/detail-page/export-generated-page";
import type {
  GeneratedMediaLayout,
  GeneratedPageTile,
} from "@/system/detail-page/page-generation-types";

const Stage = styled.section`
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--color-surface);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  width: 100%;
  height: 48px;
  min-width: 0;
  flex: 0 0 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const HeaderMeta = styled.span`
  color: var(--color-label-studio-comment);
  white-space: nowrap;
`;

const Viewport = styled.section`
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: var(--space-xl) var(--space-xl) 80px;
  background: var(--color-main-neutral-light);
  overflow: auto;
  scrollbar-width: thin;
`;

const ElapsedTime = styled.span`
  color: var(--color-label-studio-comment);
`;

const ExportDock = styled.div`
  position: absolute;
  bottom: var(--space-md);
  left: var(--space-md);
  z-index: 4;
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  box-shadow: 0 8px 24px rgb(34 29 23 / 12%);
  backdrop-filter: blur(8px);
`;

const FormatSelect = styled.select`
  height: 40px;
  padding: 0 34px 0 var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  cursor: pointer;

  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
  }
`;

const ExportError = styled.span`
  max-width: 260px;
  color: #c83d32;
  line-height: 1.35;
`;

const Page = styled.main`
  display: flex;
  width: 860px;
  min-width: 860px;
  margin: 0 auto;
  flex-direction: column;
  background: var(--color-surface);
  box-shadow: 0 12px 36px rgb(34 29 23 / 10%);
`;

const Tile = styled.section<{
  $background: string;
  $color: string;
  $placement: GeneratedPageTile["textPlacement"];
  $mediaPercent: number;
  $gap: number;
  $padding: [number, number, number, number];
}>`
  display: grid;
  width: 860px;
  max-width: 860px;
  min-height: 0;
  box-sizing: border-box;
  grid-template-columns: ${({ $placement, $mediaPercent }) => (
    $placement === "left" || $placement === "right"
      ? `${Math.max(25, 100 - $mediaPercent)}fr ${Math.min(75, $mediaPercent)}fr`
      : "minmax(0, 1fr)"
  )};
  grid-template-areas: ${({ $placement }) => {
    if ($placement === "left") return '"copy media"';
    if ($placement === "right") return '"media copy"';
    if ($placement === "bottom") return '"media" "copy"';
    return '"copy" "media"';
  }};
  align-items: center;
  gap: ${({ $gap }) => $gap}px;
  padding: ${({ $padding }) => $padding.map(value => `${value}px`).join(" ")};
  background: ${({ $background }) => $background};
  color: ${({ $color }) => $color};

  *, *::before, *::after {
    box-sizing: border-box;
    max-width: 100%;
  }
`;

const Copy = styled.div<{
  $align: GeneratedPageTile["textAlign"];
  $width: number;
}>`
  display: flex;
  width: min(${({ $width }) => $width}px, 100%);
  min-width: 0;
  grid-area: copy;
  justify-self: ${({ $align }) => ($align === "center" ? "center" : "start")};
  flex-direction: column;
  align-items: ${({ $align }) => ($align === "center" ? "center" : "flex-start")};
  text-align: ${({ $align }) => $align};
`;

const Accent = styled.span<{ $color: string }>`
  display: block;
  width: 32px;
  height: 3px;
  margin-bottom: 18px;
  background: ${({ $color }) => $color};
`;

const Title = styled.h2<{ $size: number; $weight: number }>`
  width: 100%;
  margin: 0;
  font-size: ${({ $size }) => $size}px;
  font-weight: ${({ $weight }) => $weight};
  line-height: 1.24;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
  word-break: keep-all;
`;

const Body = styled.p<{ $size: number }>`
  width: 100%;
  margin: 18px 0 0;
  font-size: ${({ $size }) => $size}px;
  line-height: 1.72;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: keep-all;
`;

const Media = styled.div<{ $layout: GeneratedMediaLayout; $count: number; $gap: number }>`
  display: grid;
  width: 100%;
  min-width: 0;
  grid-area: media;
  grid-template-columns: ${({ $layout, $count }) => {
    if ($layout === "row") return `repeat(${$count}, minmax(0, 1fr))`;
    if ($layout === "grid") return `repeat(${Math.min(2, $count)}, minmax(0, 1fr))`;
    return "minmax(0, 1fr)";
  }};
  gap: ${({ $gap }) => Math.max(12, Math.round($gap * 0.5))}px;
`;

const ImageFrame = styled.figure<{ $ratio: string }>`
  display: grid;
  width: 100%;
  min-width: 0;
  margin: 0;
  aspect-ratio: ${({ $ratio }) => $ratio.replace(":", " / ")};
  place-items: center;
  background: rgb(255 255 255 / 34%);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Placeholder = styled.section`
  display: grid;
  width: 100%;
  min-height: 0;
  flex: 1;
  place-items: center;
  background: var(--color-main-neutral-light);
`;

const PlaceholderCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
  text-align: center;

  svg:not(.animate-spin) { color: var(--color-main-primary); }
`;

const ErrorMessage = styled.p`
  max-width: 520px;
  color: #c83d32;
  line-height: 1.55;
`;

function GeneratedTile({ tile }: { tile: GeneratedPageTile }) {
  const hasMedia = tile.images.length > 0 && tile.mediaLayout !== "none";
  return (
    <Tile
      $background={tile.backgroundColor}
      $color={tile.textColor}
      $placement={hasMedia ? tile.textPlacement : "top"}
      $mediaPercent={hasMedia ? tile.mediaWidthPercent : 100}
      $gap={tile.gap}
      $padding={[tile.paddingTop, tile.paddingRight, tile.paddingBottom, tile.paddingLeft]}
      aria-label={`${tile.title} 타일`}
    >
      <Copy $align={tile.textAlign} $width={tile.textWidth}>
        <Accent $color={tile.accentColor} />
        <Title $size={tile.titleSize} $weight={tile.titleWeight}>{tile.title}</Title>
        {tile.body ? <Body $size={tile.bodySize}>{tile.body}</Body> : null}
      </Copy>
      {hasMedia ? (
        <Media $layout={tile.mediaLayout} $count={tile.images.length} $gap={tile.gap}>
          {tile.images.map(image => (
            <ImageFrame $ratio={image.aspectRatio} key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt} />
            </ImageFrame>
          ))}
        </Media>
      ) : null}
    </Tile>
  );
}

export function TemplateEditorStage() {
  const state = useDetailPageStore();
  const pageRef = useRef<HTMLElement>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [exportFormat, setExportFormat] = useState<DetailPageExportFormat>("png");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const elapsedSeconds = state.pageGenerationStartedAt
    ? Math.max(0, clock - state.pageGenerationStartedAt) / 1000
    : 0;

  useEffect(() => {
    if (!state.isPageGenerating || !state.pageGenerationStartedAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [state.isPageGenerating, state.pageGenerationStartedAt]);

  const handleExport = async () => {
    if (!pageRef.current || isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      await exportGeneratedDetailPage(pageRef.current, exportFormat);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "상세페이지를 내보내지 못했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Stage>
      <Header>
        <h2 className="type-xsmall-body">상세페이지</h2>
        {!state.isPageGenerating
          && state.generatedPage
          && state.pageGenerationDurationSeconds !== null ? (
            <HeaderMeta className="type-xsmall-thin">
              {state.pageGenerationDurationSeconds.toFixed(2)}초 소요됨
            </HeaderMeta>
          ) : null}
      </Header>
      {state.isPageGenerating ? (
        <Placeholder aria-label="상세페이지 생성 중">
          <PlaceholderCopy>
            <LoaderCircle className="animate-spin" size={42} strokeWidth={1.3} />
            <strong>상세페이지를 생성하고 있습니다.</strong>
            <span className="type-xsmall-thin">타일 배치와 개별 이미지를 제작하고 있습니다.</span>
            <ElapsedTime className="type-xsmall-thin">
              {Math.floor(elapsedSeconds)}초 경과
            </ElapsedTime>
          </PlaceholderCopy>
        </Placeholder>
      ) : state.pageGenerationError ? (
        <Placeholder aria-label="상세페이지 생성 오류">
          <PlaceholderCopy>
            <PanelsTopLeft size={32} strokeWidth={1.5} />
            <strong>상세페이지를 생성하지 못했습니다.</strong>
            <ErrorMessage className="type-xsmall-body" role="alert">
              {state.pageGenerationError}
            </ErrorMessage>
          </PlaceholderCopy>
        </Placeholder>
      ) : !state.generatedPage ? (
        <Placeholder aria-label="페이지 생성 결과 placeholder">
          <PlaceholderCopy>
            <PanelsTopLeft size={32} strokeWidth={1.5} />
            <p className="type-xsmall-body">페이지 생성 영역</p>
            <span className="type-xsmall-thin">2단계에서 페이지 생성을 시작해 주세요.</span>
          </PlaceholderCopy>
        </Placeholder>
      ) : (
        <>
          <Viewport aria-label="생성된 상세페이지">
            <Page ref={pageRef}>
              {state.generatedPage.tiles.map(tile => <GeneratedTile tile={tile} key={tile.id} />)}
            </Page>
          </Viewport>
          <ExportDock aria-label="상세페이지 내보내기">
            <FormatSelect
              className="type-xsmall-body"
              aria-label="내보내기 형식"
              value={exportFormat}
              disabled={isExporting}
              onChange={event => setExportFormat(event.target.value as DetailPageExportFormat)}
            >
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </FormatSelect>
            <PrimaryIconButton
              type="button"
              icon={isExporting ? LoaderCircle : Download}
              iconClassName={isExporting ? "animate-spin" : undefined}
              disabled={isExporting}
              onClick={() => void handleExport()}
            >
              {isExporting ? "내보내는 중" : "내보내기"}
            </PrimaryIconButton>
            {exportError ? (
              <ExportError className="type-xsmall-thin" role="alert">{exportError}</ExportError>
            ) : null}
          </ExportDock>
        </>
      )}
    </Stage>
  );
}
