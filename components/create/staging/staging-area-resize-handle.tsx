"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ChevronsUpDown, GripHorizontal } from "lucide-react";
import styled from "styled-components";

const Handle = styled.div<{ $active: boolean }>`
  position: relative;
  z-index: 5;
  display: flex;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-block: 1px solid var(--color-border);
  background: ${({ $active }) => $active ? "var(--color-main-neutral)" : "var(--color-main-neutral-light)"};
  color: var(--color-label-studio-comment);
  font-size: 10px;
  font-weight: 500;
  cursor: row-resize;
  touch-action: none;
  user-select: none;

  &:hover, &:focus-visible {
    outline: none;
    background: var(--color-main-neutral);
    color: var(--color-main-primary);
  }

  &:focus-visible { box-shadow: inset 0 0 0 2px var(--color-main-primary); }
`;

export function StagingAreaResizeHandle({
  value,
  minimum,
  maximum,
  onResize,
  onReset,
}: {
  value: number;
  minimum: number;
  maximum: number;
  onResize: (delta: number) => void;
  onReset: () => void;
}) {
  const [active, setActive] = useState(false);
  const drag = useRef<{ id: number; y: number } | null>(null);

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setActive(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Handle
      role="separator"
      aria-label="히스토리 높이 조절"
      aria-controls="generation-history"
      aria-orientation="horizontal"
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuenow={value}
      aria-valuetext={`${Math.round(value)}픽셀`}
      title="위아래로 드래그하거나 방향키로 조절 · 두 번 클릭하면 기본 높이"
      tabIndex={0}
      $active={active}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, y: event.clientY };
        setActive(true);
      }}
      onPointerMove={(event) => {
        if (drag.current?.id !== event.pointerId) return;
        onResize(drag.current.y - event.clientY);
        drag.current.y = event.clientY;
      }}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      onLostPointerCapture={() => { drag.current = null; setActive(false); }}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        const delta = event.shiftKey ? 40 : 16;
        const changes: Record<string, number> = {
          ArrowUp: delta, ArrowDown: -delta, Home: minimum - value, End: maximum - value,
        };
        if (event.key in changes) {
          event.preventDefault();
          onResize(changes[event.key]);
        } else if (event.key === "Enter") {
          event.preventDefault();
          onReset();
        }
      }}
    >
      <GripHorizontal size={20} aria-hidden="true" />
      <span>드래그하여 히스토리 높이 조절</span>
      <ChevronsUpDown size={12} aria-hidden="true" />
    </Handle>
  );
}
