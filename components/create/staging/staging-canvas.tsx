"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { getCutCount } from "@/system/create/generation-options";
import type { LibraryGenerationShot } from "@/system/create/generation-library";
import { GenerationHistoryGallery } from "./generation-history-gallery";
import { GenerationMetadataModal } from "./generation-metadata-modal";
import { GenerationProgressGrid } from "./generation-progress-grid";
import { GenerationResultActions } from "./generation-result-actions";
import { StagingAreaResizeHandle } from "./staging-area-resize-handle";
import { StagingEmptyState } from "./staging-empty-state";

const Canvas = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const HeaderText = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  p {
    color: var(--color-label-studio-comment);
  }
`;

const SplitStage = styled.div<{ $historyHeight: number }>`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-rows: minmax(0, 1fr) 9px ${({ $historyHeight }) => $historyHeight}px;
`;

const CurrentArea = styled.div`
  display: flex;
  min-height: 0;
  align-items: stretch;
  justify-content: center;
  background: var(--color-surface);
  overflow: auto;
  scrollbar-width: thin;
`;

const HISTORY_DEFAULT_HEIGHT = 182;
const HISTORY_MIN_HEIGHT = 142;
const CURRENT_MIN_HEIGHT = 180;
const RESIZE_HANDLE_HEIGHT = 9;

export function StagingCanvas() {
  const state = useCreateStore();
  const hydrateLibrary = state.hydrateLibrary;
  const splitStageRef = useRef<HTMLDivElement>(null);
  const [historyHeight, setHistoryHeight] = useState(HISTORY_DEFAULT_HEIGHT);
  const [maximumHistoryHeight, setMaximumHistoryHeight] = useState(
    HISTORY_DEFAULT_HEIGHT,
  );
  const [metadataShot, setMetadataShot] = useState<LibraryGenerationShot | null>(
    null,
  );

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

  const cutCount = getCutCount(
    state.contentSet,
    state.freeCount,
    state.angleVariationIds,
  );
  const hasGenerationMode = Boolean(
    state.contentSet || state.angleVariationIds.length > 0,
  );
  const selectedShot = state.generationShots.find(
    (shot) => shot.id === state.selectedShotId && shot.status === "done",
  ) as LibraryGenerationShot | undefined;
  const activeSet = state.generationHistory.find(
    (history) => history.id === state.activeHistoryId,
  );

  return (
    <Canvas>
      <Header>
        <HeaderText>
          <h2 className="type-xsmall-body">
            {state.generationRequested ? "생성 결과" : "스테이징 캔버스"}
          </h2>
          <p className="type-xsmall-thin">
            {state.generationRequested
              ? state.generationMessage
              : "좌측에서 재료를 준비하고 우측에서 생성을 실행하세요."}
          </p>
        </HeaderText>
        {state.generationRequested ? (
          <GenerationResultActions
            selectedShot={selectedShot}
            shots={state.generationShots as LibraryGenerationShot[]}
            setTitle={activeSet?.title ?? "itda-image-set"}
            onToggleBookmark={state.toggleBookmark}
            onShowInfo={setMetadataShot}
          />
        ) : hasGenerationMode ? (
          <span className="type-xsmall-thin">{cutCount}컷 예정</span>
        ) : null}
      </Header>
      <SplitStage ref={splitStageRef} $historyHeight={historyHeight}>
        <CurrentArea>
          {state.generationRequested ? (
            <GenerationProgressGrid
              shots={state.generationShots}
              selectedShotId={state.selectedShotId}
              onSelect={state.selectShot}
            />
          ) : (
            <StagingEmptyState
              productImage={state.productImage}
              referenceImage={state.referenceImage}
            />
          )}
        </CurrentArea>
        <StagingAreaResizeHandle
          value={historyHeight}
          minimum={HISTORY_MIN_HEIGHT}
          maximum={maximumHistoryHeight}
          onResize={resizeHistory}
        />
        <GenerationHistoryGallery
          history={state.generationHistory}
          activeHistoryId={state.activeHistoryId}
          deleteDisabled={state.isGenerating}
          onRestore={state.restoreHistory}
          onDelete={state.deleteHistory}
        />
      </SplitStage>
      {metadataShot ? (
        <GenerationMetadataModal
          shot={metadataShot}
          onClose={() => setMetadataShot(null)}
        />
      ) : null}
    </Canvas>
  );
}
