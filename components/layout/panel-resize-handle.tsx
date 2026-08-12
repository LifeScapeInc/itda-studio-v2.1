"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import styled from "styled-components";

const Handle = styled.div<{
  $active: boolean;
  $edge: "left" | "right";
}>`
  position: absolute;
  z-index: 8;
  top: 0;
  bottom: 0;
  ${({ $edge }) => ($edge === "left" ? "left: -5px;" : "right: -5px;")}
  width: 10px;
  outline: none;
  cursor: col-resize;
  touch-action: none;

  &::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: var(--color-main-primary);
    content: "";
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transform: translateX(-50%);
    transition: opacity 140ms ease;
  }

  &:hover::after,
  &:focus-visible::after {
    opacity: 1;
  }
`;

type PanelResizeHandleProps = {
  edge: "left" | "right";
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  onResize: (delta: number) => void;
};

export function PanelResizeHandle({
  edge,
  label,
  value,
  minimum,
  maximum,
  onResize,
}: PanelResizeHandleProps) {
  const [active, setActive] = useState(false);
  const lastPointerX = useRef(0);
  const cleanupDrag = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupDrag.current?.();
    };
  }, []);

  const beginResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    lastPointerX.current = event.clientX;
    setActive(true);

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const pointerDelta = moveEvent.clientX - lastPointerX.current;
      const widthDelta = edge === "right" ? pointerDelta : -pointerDelta;
      lastPointerX.current = moveEvent.clientX;
      onResize(widthDelta);
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
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={minimum}
      aria-valuemax={maximum}
      aria-valuenow={value}
      tabIndex={0}
      $active={active}
      $edge={edge}
      onMouseDown={beginResize}
      onKeyDown={(event) => {
        const expandKey = edge === "right" ? "ArrowRight" : "ArrowLeft";
        const shrinkKey = edge === "right" ? "ArrowLeft" : "ArrowRight";

        if (event.key === expandKey) {
          event.preventDefault();
          onResize(8);
        }

        if (event.key === shrinkKey) {
          event.preventDefault();
          onResize(-8);
        }
      }}
    />
  );
}
