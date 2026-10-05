"use client";

import { useRef, useState, type PointerEvent } from "react";
import styled from "styled-components";

const Handle = styled.div<{ $active: boolean }>`
  position: relative;
  z-index: 5;
  display: flex;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  color: ${({ $active }) => $active ? "var(--color-main-primary)" : "var(--color-label-studio-comment)"};
  cursor: row-resize;
  touch-action: none;
  user-select: none;

  &:hover, &:focus-visible {
    outline: none;
    color: var(--color-main-primary);
  }

  &:focus-visible { box-shadow: inset 0 0 0 2px var(--color-main-primary); }
  &:hover span, &:focus-visible span {
    background: var(--color-main-primary);
    opacity: 1;
  }
`;
const Grip = styled.span`
  width: 32px;
  height: 3px;
  border-radius: 999px;
  background: var(--color-label-studio-comment);
  opacity: 0.65;
  transition: background-color 160ms ease, opacity 160ms ease;
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
      <Grip aria-hidden="true" />
    </Handle>
  );
}
