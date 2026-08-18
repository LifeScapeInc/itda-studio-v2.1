"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FileText, GripVertical, ImageIcon, Info, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { CollapsibleSection } from "@/components/create/settings/collapsible-section";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import {
  DETAIL_TILE_DEFINITIONS,
  type DetailTile,
  type DetailTileDefinition,
  type DetailTileType,
} from "@/system/detail-page/detail-page-types";
import {
  DETAIL_TILE_LIBRARY_PANEL_MAX_WIDTH,
  DETAIL_TILE_LIBRARY_PANEL_MIN_WIDTH,
  DETAIL_TILE_PROPERTIES_PANEL_MAX_WIDTH,
  DETAIL_TILE_PROPERTIES_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";
import {
  TEMPLATE_DROPZONE_ID,
  TEMPLATE_INSERTION_PLACEHOLDER_ID,
  TemplateWireframe,
} from "./template-wireframe";

const LIBRARY_PREFIX = "detail-tile-library:";

const detectTemplateCollision: CollisionDetection = (args) => {
  const draggedId = String(args.active.id);
  return draggedId.startsWith(LIBRARY_PREFIX)
    ? pointerWithin(args)
    : closestCenter(args);
};

const Composer = styled.div<{
  $libraryWidth: number;
  $propertiesWidth: number;
}>`
  display: grid;
  width: 100%;
  min-height: 0;
  height: 100%;
  grid-template-columns:
    ${({ $libraryWidth }) => $libraryWidth}px
    minmax(360px, 1fr)
    ${({ $propertiesWidth }) => $propertiesWidth}px;
  background: var(--color-surface);
  overflow: hidden;
`;

const Panel = styled.section`
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface);
  overflow: visible;
`;

const LibraryPanel = styled(Panel)`
  border-right: 1px solid var(--color-border);
`;

const TemplatePanel = styled(Panel)`
  border-right: 1px solid var(--color-border);
`;

const PanelHeader = styled.header`
  display: flex;
  height: 48px;
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

const ElapsedTime = styled.span`
  color: var(--color-label-studio-comment);
`;

const TemplatePlaceholder = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
  text-align: center;

  p {
    color: #c83d32;
    line-height: 1.45;
  }
`;

const PlanSummary = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--space-2xs);
  padding-top: var(--space-xs);
`;

const PlanTopline = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);
`;

const Axis = styled.span`
  flex: 0 0 auto;
  color: var(--color-main-primary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
`;

const PlanTitle = styled.h3`
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  font-weight: 700;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

const Slogan = styled.p`
  color: var(--color-label-studio-comment);
  line-height: 1.45;
`;

const Keywords = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs) var(--space-2xs);
  color: var(--color-main-primary);
`;

const TileList = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-sm);
  overflow: auto;
`;

const LibraryTile = styled.button<{ $dragging: boolean }>`
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  opacity: ${({ $dragging }) => ($dragging ? 0.28 : 1)};
  text-align: left;
  cursor: grab;
  touch-action: none;

  &:active { cursor: grabbing; }
  &:hover, &:focus-visible { border-color: var(--color-main-primary); outline: none; }

  span {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: var(--space-3xs);
  }

  small { color: var(--color-label-studio-comment); font-size: 10px; }
`;

const InspectorBody = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm);
  overflow: auto;

  p { color: var(--color-label-studio-comment); line-height: 1.55; }
`;

const Kind = styled.span`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: var(--space-3xs);
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);
  font-size: 10px;
`;

const Prompt = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);

  p { color: var(--color-label-studio-black); font-size: 12px; }
`;

const DragPreview = styled.div<{ $large: boolean; $kind: "image" | "info" }>`
  display: flex;
  width: ${({ $large }) => ($large ? "min(640px, 56vw)" : "248px")};
  min-height: ${({ $large }) => ($large ? "150px" : "54px")};
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: var(--space-xs);
  border: 1px solid var(--color-main-primary);
  border-radius: 8px;
  background: ${({ $large, $kind }) => (
    $large && $kind === "image"
      ? "var(--color-main-neutral)"
      : "var(--color-main-neutral-light)"
  )};
  box-shadow: 0 14px 34px rgb(32 29 23 / 16%);
  cursor: grabbing;

  span { display: flex; align-items: center; gap: var(--space-2xs); }
`;

function DraggableLibraryTile({ definition, onAdd }: {
  definition: DetailTileDefinition;
  onAdd: (type: DetailTileType) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${LIBRARY_PREFIX}${definition.type}`,
    data: { type: definition.type },
  });

  return (
    <LibraryTile
      ref={setNodeRef}
      type="button"
      $dragging={isDragging}
      title="드래그하거나 더블클릭하여 추가"
      onDoubleClick={() => onAdd(definition.type)}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={15} />
      {definition.kind === "image" ? <ImageIcon size={15} /> : <Info size={15} />}
      <span>
        <strong>{definition.label}</strong>
        <small>{definition.kind === "image" ? "이미지 타일" : "정보 타일"}</small>
      </span>
    </LibraryTile>
  );
}

function OverlayContent({ definition, large }: {
  definition: DetailTileDefinition | DetailTile;
  large: boolean;
}) {
  return (
    <DragPreview $large={large} $kind={definition.kind}>
      <span>
        {definition.kind === "image" ? <ImageIcon size={18} /> : <Info size={18} />}
        <strong className="type-xsmall-body">{definition.label}</strong>
      </span>
    </DragPreview>
  );
}

export function TemplateComposer() {
  const state = useDetailPageStore();
  const mockMode = useAppSettingsStore(settings => settings.mockMode);
  const [clock, setClock] = useState(() => Date.now());
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [insertionPreview, setInsertionPreview] = useState<{
    index: number;
    definition: DetailTileDefinition;
  } | null>(null);
  const libraryPanelWidth = useWorkspaceLayoutStore(
    layout => layout.detailTileLibraryPanelWidth,
  );
  const propertiesPanelWidth = useWorkspaceLayoutStore(
    layout => layout.detailTilePropertiesPanelWidth,
  );
  const resizeLibraryPanel = useWorkspaceLayoutStore(
    layout => layout.resizeDetailTileLibraryPanel,
  );
  const resizePropertiesPanel = useWorkspaceLayoutStore(
    layout => layout.resizeDetailTilePropertiesPanel,
  );
  const selectedPlan = state.plans.find(plan => plan.id === state.selectedPlanId);
  const selectedTile = state.tiles.find(tile => tile.id === state.selectedTileId);
  const selectedDefinition = selectedTile
    ? DETAIL_TILE_DEFINITIONS.find(definition => definition.type === selectedTile.type)
    : undefined;
  const activeDefinition = activeId?.startsWith(LIBRARY_PREFIX)
    ? DETAIL_TILE_DEFINITIONS.find(item => item.type === activeId.slice(LIBRARY_PREFIX.length))
    : state.tiles.find(tile => tile.id === activeId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const templateElapsedSeconds = state.templatePlanningStartedAt
    ? Math.max(0, clock - state.templatePlanningStartedAt) / 1000
    : 0;

  useEffect(() => {
    if (!state.isTemplatePlanning || !state.templatePlanningStartedAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [state.isTemplatePlanning, state.templatePlanningStartedAt]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setInsertionPreview(null);
    if (!over) return;
    const draggedId = String(active.id);
    const overId = String(over.id);

    if (draggedId.startsWith(LIBRARY_PREFIX)) {
      const type = draggedId.slice(LIBRARY_PREFIX.length) as DetailTileType;
      const targetIndex = overId === TEMPLATE_INSERTION_PLACEHOLDER_ID
        ? insertionPreview?.index
        : overId === TEMPLATE_DROPZONE_ID
          ? state.tiles.length
          : state.tiles.findIndex(tile => tile.id === overId);
      state.addTile(
        type,
        targetIndex === undefined || targetIndex < 0 ? undefined : targetIndex,
      );
      return;
    }

    if (draggedId === overId || overId === TEMPLATE_DROPZONE_ID) return;
    const oldIndex = state.tiles.findIndex(tile => tile.id === draggedId);
    const newIndex = state.tiles.findIndex(tile => tile.id === overId);
    if (oldIndex >= 0 && newIndex >= 0) {
      state.reorderTiles(arrayMove(state.tiles, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={detectTemplateCollision}
      onDragStart={({ active }) => {
        setActiveId(String(active.id));
        setInsertionPreview(null);
      }}
      onDragOver={({ active, over }) => {
        const draggedId = String(active.id);
        if (!draggedId.startsWith(LIBRARY_PREFIX) || !over) {
          setInsertionPreview(null);
          return;
        }
        const overId = String(over.id);
        if (overId === TEMPLATE_INSERTION_PLACEHOLDER_ID) return;
        const definition = DETAIL_TILE_DEFINITIONS.find(
          item => item.type === draggedId.slice(LIBRARY_PREFIX.length),
        );
        if (!definition) return;
        const targetIndex = overId === TEMPLATE_DROPZONE_ID
          ? state.tiles.length
          : state.tiles.findIndex(tile => tile.id === overId);
        setInsertionPreview(targetIndex < 0 ? null : { index: targetIndex, definition });
      }}
      onDragCancel={() => {
        setActiveId(null);
        setInsertionPreview(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <Composer
        $libraryWidth={libraryPanelWidth}
        $propertiesWidth={propertiesPanelWidth}
      >
        <LibraryPanel>
          <PanelResizeHandle
            edge="right"
            label="타일 목록 패널 너비 조절"
            value={libraryPanelWidth}
            minimum={DETAIL_TILE_LIBRARY_PANEL_MIN_WIDTH}
            maximum={DETAIL_TILE_LIBRARY_PANEL_MAX_WIDTH}
            onResize={resizeLibraryPanel}
          />
          <PanelHeader><h2 className="type-xsmall-body">타일 목록</h2></PanelHeader>
          <TileList>
            {DETAIL_TILE_DEFINITIONS.map(definition => (
              <DraggableLibraryTile definition={definition} onAdd={state.addTile} key={definition.type} />
            ))}
          </TileList>
        </LibraryPanel>
        <TemplatePanel>
          <PanelHeader>
            <h2 className="type-xsmall-body">템플릿 편집</h2>
            {!state.isTemplatePlanning && state.templatePlanningDurationSeconds !== null ? (
              <HeaderMeta className="type-xsmall-thin">
                {state.templatePlanningDurationSeconds.toFixed(2)}초 소요됨
              </HeaderMeta>
            ) : null}
          </PanelHeader>
          {state.isTemplatePlanning ? (
            <TemplatePlaceholder>
              <LoaderCircle className="animate-spin" size={42} strokeWidth={1.3} />
              <strong>템플릿 구조를 생성하고 있습니다.</strong>
              <ElapsedTime className="type-xsmall-thin">
                {Math.floor(templateElapsedSeconds)}초 경과
              </ElapsedTime>
            </TemplatePlaceholder>
          ) : state.templatePlanningError && !state.tiles.length ? (
            <TemplatePlaceholder>
              <p className="type-xsmall-body" role="alert">{state.templatePlanningError}</p>
            </TemplatePlaceholder>
          ) : (
            <TemplateWireframe
              tiles={state.tiles}
              selectedTileId={state.selectedTileId}
              insertionPreview={insertionPreview}
              onSelect={state.selectTile}
              onRemove={state.removeTile}
              onUpdateTile={state.updateTile}
            />
          )}
        </TemplatePanel>
        <Panel>
          <PanelResizeHandle
            edge="left"
            label="속성 패널 너비 조절"
            value={propertiesPanelWidth}
            minimum={DETAIL_TILE_PROPERTIES_PANEL_MIN_WIDTH}
            maximum={DETAIL_TILE_PROPERTIES_PANEL_MAX_WIDTH}
            onResize={resizePropertiesPanel}
          />
          <PanelHeader><h2 className="type-xsmall-body">속성</h2></PanelHeader>
          <InspectorBody>
            <CollapsibleSection
              title="기획안"
              icon={<FileText size={16} />}
              open={planOpen}
              onToggle={() => setPlanOpen(open => !open)}
            >
              <PlanSummary>
                {selectedPlan ? (
                  <>
                    <PlanTopline>
                      <Axis>{selectedPlan.axisName}</Axis>
                      <PlanTitle className="type-xsmall-body">
                        {selectedPlan.concept}
                      </PlanTitle>
                    </PlanTopline>
                    <Slogan className="type-xsmall-thin">
                      {selectedPlan.coreSlogan}
                    </Slogan>
                    <Keywords className="type-xsmall-thin">
                      {selectedPlan.keywords.map(keyword => (
                        <span key={keyword}>#{keyword}</span>
                      ))}
                    </Keywords>
                  </>
                ) : (
                  <p className="type-xsmall-body">선택된 기획안이 없습니다.</p>
                )}
              </PlanSummary>
            </CollapsibleSection>
            {selectedTile ? (
              <>
                <Kind>
                  {selectedTile.kind === "image" ? <ImageIcon size={12} /> : <Info size={12} />}
                  {selectedTile.kind === "image" ? "이미지 타일" : "정보 타일"}
                </Kind>
                <h3 className="type-small-body">{selectedTile.label}</h3>
                <p className="type-xsmall-body">
                  {selectedDefinition?.description}
                </p>
                {selectedTile.kind === "image" ? (
                  <Prompt>
                    <strong className="type-xsmall-body">이미지 제작 프롬프트</strong>
                    <p>{selectedTile.prompt}</p>
                  </Prompt>
                ) : null}
              </>
            ) : (
              <p className="type-xsmall-body">와이어프레임에서 타일을 선택해 주세요.</p>
            )}
            <PrimaryIconButton
              type="button"
              icon={Sparkles}
              fullWidth
              disabled={!state.tiles.length}
              style={{ marginTop: "auto" }}
              onClick={() => void state.startEditing(mockMode)}
            >
              페이지 생성
            </PrimaryIconButton>
          </InspectorBody>
        </Panel>
      </Composer>
      {mounted ? createPortal(
        <DragOverlay
          zIndex={1000}
          dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        >
          {activeDefinition ? (
            <OverlayContent
              definition={activeDefinition}
              large={!activeId?.startsWith(LIBRARY_PREFIX)}
            />
          ) : null}
        </DragOverlay>,
        document.body,
      ) : null}
    </DndContext>
  );
}
