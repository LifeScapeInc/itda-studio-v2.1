"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ImageIcon, Info, Pencil, X } from "lucide-react";
import { Fragment, useState } from "react";
import styled from "styled-components";
import type { DetailTile, DetailTileDefinition } from "@/system/detail-page/detail-page-types";

export const TEMPLATE_DROPZONE_ID = "detail-template-dropzone";
export const TEMPLATE_INSERTION_PLACEHOLDER_ID = "detail-template-insertion-placeholder";

const Canvas = styled.div<{ $over: boolean }>`
  width: 100%;
  min-height: 0;
  flex: 1;
  padding: var(--space-lg);
  outline: ${({ $over }) => ($over ? "1px solid var(--color-main-primary)" : "0")};
  outline-offset: -1px;
  background: var(--color-surface);
  overflow: auto;
  transition: outline-color 120ms ease;
`;

const Empty = styled.div<{ $over: boolean }>`
  display: grid;
  min-height: 320px;
  place-items: center;
  border: 1px dashed ${({ $over }) => ($over ? "var(--color-main-primary)" : "var(--color-border)")};
  color: var(--color-label-studio-comment);
`;

const Placeholder = styled.div`
  display: grid;
  min-height: 164px;
  margin-bottom: var(--space-2xs);
  place-items: center;
  border: 1px dashed var(--color-main-primary);
  background: color-mix(in srgb, var(--color-main-primary) 8%, transparent);
  color: var(--color-main-primary);
  opacity: 0.62;

  span {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
  }
`;

const Tile = styled.article<{ $active: boolean; $kind: "image" | "info"; $dragging: boolean }>`
  position: relative;
  display: flex;
  min-height: 112px;
  align-items: stretch;
  justify-content: flex-start;
  margin-bottom: var(--space-2xs);
  border: 1px solid ${({ $active }) => ($active ? "var(--color-main-primary)" : "var(--color-border)")};
  background: ${({ $kind }) => ($kind === "image" ? "var(--color-main-neutral)" : "var(--color-main-neutral-light)")};
  opacity: ${({ $dragging }) => ($dragging ? 0.5 : 1)};
  transition: border-color 120ms ease, opacity 120ms ease;

  &:last-child { margin-bottom: 0; }
`;

const DragHandle = styled.button`
  position: absolute;
  top: var(--space-sm);
  left: var(--space-xs);
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: grab;
  touch-action: none;

  &:active { cursor: grabbing; }
`;

const Actions = styled.div`
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
`;

const ActionButton = styled.button<{ $confirm?: boolean }>`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $confirm }) => ($confirm ? "var(--color-main-primary)" : "var(--color-label-studio-comment)")};
  cursor: pointer;

  &:hover {
    color: ${({ $confirm }) => ($confirm ? "var(--color-main-primary)" : "var(--color-label-studio-black)")};
  }
`;

const TileContent = styled.div`
  display: flex;
  width: 100%;
  min-height: 110px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm) 52px var(--space-sm) 44px;

  & > span {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-2xs);
    margin-bottom: var(--space-2xs);
  }
`;

const EditField = styled.label`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--space-3xs);

  & > span {
    color: var(--color-label-studio-comment);
    font-size: 11px;
  }
`;

const DescriptionText = styled.p`
  width: 100%;
  min-height: 42px;
  margin: 0;
  color: var(--color-label-studio-comment);
  line-height: 1.55;
  white-space: pre-wrap;
`;

const Description = styled.textarea`
  width: 100%;
  min-height: 80px;
  resize: vertical;
  padding: var(--space-xs);
  border: 1px solid var(--color-main-primary);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  line-height: 1.5;
  scrollbar-width: thin;

  &:focus { border-color: var(--color-main-primary); outline: none; }
`;

const LayoutDescription = styled(Description)`
  min-height: 112px;
`;

const LayoutText = styled(DescriptionText)`
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border);
`;

const ShotCount = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-label-studio-comment);

  input {
    width: 58px;
    height: 32px;
    padding: 0 var(--space-2xs);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
    text-align: center;
  }
`;

const FixedShotCount = styled.span`
  color: var(--color-label-studio-comment);
`;

function SortableTile({ tile, selected, onSelect, onRemove, onUpdateTile }: {
  tile: DetailTile;
  selected: boolean;
  onSelect: (tileId: string) => void;
  onRemove: (tileId: string) => void;
  onUpdateTile: (tileId: string, changes: Partial<Pick<DetailTile, "description" | "imageLayout" | "shotCount">>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState(tile.description);
  const [draftImageLayout, setDraftImageLayout] = useState(tile.imageLayout ?? "");
  const maximumImageCount = tile.type === "hero" ? 1 : 4;
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.id,
    transition: {
      duration: 220,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  });

  const startEditing = () => {
    setDraftDescription(tile.description);
    setDraftImageLayout(tile.imageLayout ?? "");
    setEditing(true);
    onSelect(tile.id);
  };

  const cancelEditing = () => {
    setDraftDescription(tile.description);
    setDraftImageLayout(tile.imageLayout ?? "");
    setEditing(false);
  };

  const saveEditing = () => {
    onUpdateTile(tile.id, {
      description: draftDescription,
      imageLayout: tile.kind === "image" ? draftImageLayout : undefined,
    });
    setEditing(false);
  };

  return (
    <Tile
      ref={setNodeRef}
      $active={selected || editing}
      $kind={tile.kind}
      $dragging={isDragging}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onSelect(tile.id)}
    >
      <DragHandle ref={setActivatorNodeRef} type="button" aria-label={`${tile.label} 이동`} {...attributes} {...listeners}>
        <GripVertical size={18} />
      </DragHandle>
      <TileContent>
        <span>
          {tile.kind === "image" ? <ImageIcon size={18} /> : <Info size={18} />}
          <strong className="type-xsmall-body">{tile.label}</strong>
        </span>
        {editing ? (
          <>
            <EditField>
              <span>내용</span>
              <Description
                autoFocus
                className="type-xsmall-body"
                aria-label={`${tile.label} 내용 수정`}
                value={draftDescription}
                onClick={event => event.stopPropagation()}
                onChange={event => setDraftDescription(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEditing();
                  }
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    saveEditing();
                  }
                }}
              />
            </EditField>
            {tile.kind === "image" ? (
              <EditField>
                <span>이미지 레이아웃</span>
                <LayoutDescription
                  className="type-xsmall-body"
                  aria-label={`${tile.label} 이미지 레이아웃 수정`}
                  value={draftImageLayout}
                  onClick={event => event.stopPropagation()}
                  onChange={event => setDraftImageLayout(event.target.value)}
                />
              </EditField>
            ) : null}
          </>
        ) : (
          <>
            <DescriptionText className="type-xsmall-body">{tile.description}</DescriptionText>
            {tile.kind === "image" && tile.imageLayout ? (
              <LayoutText className="type-xsmall-body">{tile.imageLayout}</LayoutText>
            ) : null}
          </>
        )}
        {tile.kind === "image" ? (
          tile.type === "hero" ? (
            <FixedShotCount className="type-xsmall-thin">이미지 구성 1장</FixedShotCount>
          ) : (
            <ShotCount className="type-xsmall-thin">
              이미지 구성
              <input
                type="number"
                min={1}
                max={maximumImageCount}
                aria-label={`${tile.label} 이미지 컷 수`}
                value={tile.shotCount ?? 1}
                onClick={event => event.stopPropagation()}
                onChange={event => onUpdateTile(tile.id, {
                  shotCount: Math.max(1, Math.min(maximumImageCount, Number(event.target.value) || 1)),
                })}
              />
              장
            </ShotCount>
          )
        ) : null}
      </TileContent>
      <Actions>
        {editing ? (
          <>
            <ActionButton
              $confirm
              type="button"
              aria-label={`${tile.label} 수정 저장`}
              onClick={event => { event.stopPropagation(); saveEditing(); }}
            >
              <Check size={16} />
            </ActionButton>
            <ActionButton
              type="button"
              aria-label={`${tile.label} 수정 취소`}
              onClick={event => { event.stopPropagation(); cancelEditing(); }}
            >
              <X size={16} />
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              type="button"
              aria-label={`${tile.label} 설명 수정`}
              onClick={event => { event.stopPropagation(); startEditing(); }}
            >
              <Pencil size={15} />
            </ActionButton>
            <ActionButton
              type="button"
              aria-label={`${tile.label} 제거`}
              onClick={event => { event.stopPropagation(); onRemove(tile.id); }}
            >
              <X size={16} />
            </ActionButton>
          </>
        )}
      </Actions>
    </Tile>
  );
}

function InsertionPlaceholder({ definition }: { definition: DetailTileDefinition }) {
  const { setNodeRef } = useDroppable({ id: TEMPLATE_INSERTION_PLACEHOLDER_ID });

  return (
    <Placeholder ref={setNodeRef} aria-label={`${definition.label} 추가 위치`}>
      <span>
        {definition.kind === "image" ? <ImageIcon size={18} /> : <Info size={18} />}
        <strong className="type-xsmall-body">{definition.label}</strong>
      </span>
    </Placeholder>
  );
}

export function TemplateWireframe({ tiles, selectedTileId, insertionPreview, onSelect, onRemove, onUpdateTile }: {
  tiles: DetailTile[];
  selectedTileId: string | null;
  insertionPreview?: {
    index: number;
    definition: DetailTileDefinition;
  } | null;
  onSelect: (tileId: string) => void;
  onRemove: (tileId: string) => void;
  onUpdateTile: (tileId: string, changes: Partial<Pick<DetailTile, "description" | "imageLayout" | "shotCount">>) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TEMPLATE_DROPZONE_ID });

  return (
    <Canvas ref={setNodeRef} $over={isOver} aria-label="상세 페이지 와이어프레임">
      <SortableContext items={tiles.map(tile => tile.id)} strategy={verticalListSortingStrategy}>
        {tiles.length || insertionPreview ? (
          <>
            {tiles.map((tile, index) => (
              <Fragment key={tile.id}>
                {insertionPreview?.index === index ? (
                  <InsertionPlaceholder definition={insertionPreview.definition} />
                ) : null}
                <SortableTile
                  tile={tile}
                  selected={tile.id === selectedTileId}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onUpdateTile={onUpdateTile}
                />
              </Fragment>
            ))}
            {insertionPreview && insertionPreview.index >= tiles.length ? (
              <InsertionPlaceholder definition={insertionPreview.definition} />
            ) : null}
          </>
        ) : (
          <Empty $over={isOver}>
            <span className="type-xsmall-thin">왼쪽 목록에서 타일을 끌어오세요.</span>
          </Empty>
        )}
      </SortableContext>
    </Canvas>
  );
}
