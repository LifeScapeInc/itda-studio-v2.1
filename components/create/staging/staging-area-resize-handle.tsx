"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import styled from "styled-components";

const Handle = styled.div<{ $active: boolean }>`
  position: relative;
  z-index: 5;
  height: 9px;
  outline: none;
  background: var(--color-surface);
  cursor: row-resize;
  touch-action: none;

  &::before {
    position: absolute;
    top: 4px;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--color-border);
    content: "";
  }

  &::after {
    position: absolute;
    top: 3px;
    right: 0;
    left: 0;
    height: 3px;
    background: var(--color-main-primary);
    content: "";
    opacity: ${({ $active }) => $active ? 1 : 0};
    transition: opacity 140ms ease;
  }

  &:hover::after,
  &:focus-visible::after {
    opacity: 1;
  }
`;

export function StagingAreaResizeHandle({
  value,
  minimum,
  maximum,
  onResize,
}: {
  value: number;
  minimum: number;
  maximum: number;
  onResize: (delta: number) => void;
}) {
  const [active, setActive] = useState(false);
  const lastPointerY = useRef(0);
  const cleanupDrag = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupDrag.current?.(), []);

  const beginResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    lastPointerY.current = event.clientY;
    setActive(true);

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const heightDelta = lastPointerY.current - moveEvent.clientY;
      lastPointerY.current = moveEvent.clientY;
      onResize(heightDelta);
    };

    const finishResize = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", finishResize);
      document.body.style.userSelect = previousUserSelect;
      cleanupDrag.current = null;
      setActive(false);
    };

    cleanupDrag.current?.();
    cleanupDrag.current = finishResize;
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", finishResize);
  };

  return (
    <Handle
      role="separator"
      aria-label="현재 결과와 히스토리 높이 조절"
      aria-orientation="horizontal"
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuenow={value}
      tabIndex={0}
      $active={active}
      onMouseDown={beginResize}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onResize(8);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          onResize(-8);
        }
      }}
    />
  );
}
