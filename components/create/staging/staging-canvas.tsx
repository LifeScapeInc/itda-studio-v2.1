"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  belongsToProject,
  type LibraryGenerationShot,
} from "@/system/create/generation-library";
import { GenerationHistoryGallery } from "./history/generation-history-gallery";
import { GeneratedImageLightbox } from "./generated/generated-image-lightbox";
import { GeneratedMetadataModal } from "./generated/generated-metadata-modal";
import { GeneratedNavigation } from "./generated/generated-navigation";
import { ResultContextMenuController, type ResultContextMenuHandle } from "./generated/result-context-menu-controller";
import { GeneratedImageViewer } from "./generated/generated-image-viewer";
import { GeneratedProgressGrid } from "./generated/generated-progress-grid";
import { StagingAreaResizeHandle } from "./staging-area-resize-handle";
import { StagingEmptyState } from "./staging-empty-state";

const Canvas = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: transparent;
`;

const Header = styled.header`
  position: relative;
  display: flex;
  min-height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: 0 6px;
  border-bottom: 0;
  background: var(--color-surface);
`;

const HeaderText = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const SplitStage = styled.div<{ $historyHeight: number }>`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-rows: minmax(0, 1fr) 8px ${({ $historyHeight }) => $historyHeight}px;
`;

const Stage = styled.div`display: flex; flex-direction: column; min-width: 0; min-height: 0; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); overflow: hidden;`;

const CurrentArea = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: stretch;
  justify-content: center;
  background: var(--color-surface);
  overflow: auto;
  scrollbar-width: thin;
`;

const HISTORY_DEFAULT_HEIGHT = 220;
const HISTORY_MIN_HEIGHT = 142;
const CURRENT_MIN_HEIGHT = 180;
const RESIZE_HANDLE_HEIGHT = 8;

export const StagingCanvas = memo(function StagingCanvas({
  projectId,
  projectName,
}: {
  projectId: string | null;
  projectName?: string;
}) {
  const state = useCreateStore();
  const mockMode = useAppSettingsStore(s => s.mockMode);
  const hydrateLibrary = state.hydrateLibrary;
  const splitStageRef = useRef<HTMLDivElement>(null);
  const [historyHeight, setHistoryHeight] = useState(HISTORY_DEFAULT_HEIGHT);
  const [maximumHistoryHeight, setMaximumHistoryHeight] = useState(
    HISTORY_DEFAULT_HEIGHT,
  );
  const contextMenuRef = useRef<ResultContextMenuHandle>(null);
  const [metadataShots, setMetadataShots] = useState<LibraryGenerationShot[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{
    imageUrl: string;
    alt: string;
  } | null>(null);

  const [focusedImage, setFocusedImage] = useState<{ id: string; historyId: string | null } | null>(null);
  const focusedShot = focusedImage?.historyId === state.activeHistoryId ? state.generationShots.find(shot => shot.id === focusedImage?.id && shot.imageUrl) : undefined;

  const resizeHistory = useCallback((delta: number) => {
    setHistoryHeight((current) => Math.min(
      maximumHistoryHeight,
      Math.max(HISTORY_MIN_HEIGHT, current + delta),
    ));
  }, [maximumHistoryHeight]);

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  useEffect(() => {
    const stage = splitStageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(() => {
      const nextMaximum = Math.max(
        HISTORY_MIN_HEIGHT,
        stage.clientHeight - CURRENT_MIN_HEIGHT - RESIZE_HANDLE_HEIGHT,
      );
      setMaximumHistoryHeight(nextMaximum);
      setHistoryHeight((current) => Math.min(
        nextMaximum,
        Math.max(HISTORY_MIN_HEIGHT, current),
      ));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const selectedShots = state.generationShots.filter(shot => state.selectedShotIds.includes(shot.id) && shot.status === "done" && shot.imageUrl) as LibraryGenerationShot[];
  const scopedHistory = state.generationHistory.filter(history => (
    belongsToProject(history, projectId)
  ));
  const activeSet = scopedHistory.find(
    (history) => history.id === state.activeHistoryId,
  );

  return (
    <Canvas>
      <SplitStage ref={splitStageRef} $historyHeight={historyHeight}>
      <Stage>
      <Header>
        <HeaderText>
          <h2 className="type-xsmall-body">
            {state.generationRequested ? "생성 결과" : "스테이징 캔버스"}
          </h2>
        </HeaderText>
        {state.generationRequested ? (
          <GeneratedNavigation
            detailView={Boolean(focusedShot?.imageUrl)}
            hasActiveHistory={Boolean(activeSet)}
            closeDisabled={false}
            onClear={focusedShot ? () => setFocusedImage(null) : state.clearStaging}
            selectedShots={selectedShots}
            shots={state.generationShots as LibraryGenerationShot[]}
            setTitle={activeSet?.title ?? "itda-image-set"}
            onSetBookmarks={state.setBookmarks}
            onShowInfo={setMetadataShots}
          />
        ) : null}
      </Header>
        <CurrentArea onContextMenu={event => {
          const id = (event.target as HTMLElement).closest<HTMLElement>("[data-shot-id]")?.dataset.shotId ?? focusedShot?.id;
          const shot = state.generationShots.find(item => item.id === id && item.status === "done" && item.imageUrl);
          if (!shot) return;
          event.preventDefault();
          contextMenuRef.current?.open(shot.id, event.clientX, event.clientY);
        }} onClick={event => { if (event.target === event.currentTarget) state.selectShot(null); }} onKeyDown={event => { if (event.key === "Escape") state.selectShot(null); }}>
          {state.generationRequested ? focusedShot?.imageUrl ? (
            <GeneratedImageViewer key={focusedShot.id} src={focusedShot.imageUrl} alt={`${focusedShot.label} 생성 결과`} onBack={() => setFocusedImage(null)} />
          ) : (
            <GeneratedProgressGrid
              shots={state.generationShots}
              selectedShotIds={state.selectedShotIds}
              onSelect={state.selectShot}
              onRetry={id => void state.retryShot(id, mockMode)}
              onOpenImage={(shot) => {
                if (!shot.imageUrl) return;
                state.selectShot(shot.id);
                setFocusedImage({ id: shot.id, historyId: state.activeHistoryId });
              }}
            />
          ) : (
            <StagingEmptyState
              productImage={state.productImage}
              referenceImage={state.referenceImage}
              onOpenImage={(imageUrl, alt) => {
                setLightboxImage({ imageUrl, alt });
              }}
            />
          )}
        </CurrentArea>
      </Stage>
        <StagingAreaResizeHandle
          value={historyHeight}
          minimum={HISTORY_MIN_HEIGHT}
          maximum={maximumHistoryHeight}
          onResize={resizeHistory}
        />
        <GenerationHistoryGallery
          history={scopedHistory}
          projectName={projectName}
          activeHistoryId={state.activeHistoryId}
          onRestore={id => { setFocusedImage(null); state.restoreHistory(id); }}
          onDelete={state.deleteHistory}
        />
      </SplitStage>
      <ResultContextMenuController ref={contextMenuRef} onShowInfo={setMetadataShots} />
      {metadataShots.length ? (
        <GeneratedMetadataModal
          shots={metadataShots}
          onClose={() => setMetadataShots([])}
        />
      ) : null}
      {lightboxImage ? (
        <GeneratedImageLightbox
          imageUrl={lightboxImage.imageUrl}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      ) : null}
    </Canvas>
  );
});
