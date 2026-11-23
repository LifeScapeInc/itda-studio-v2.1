"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import styled from "styled-components";

const Handle = styled.div<{
  $active: boolean;
  $edge: "left" | "right";
  $gap: number;
}>`
  position: absolute;
  z-index: 8;
  top: 0;
  bottom: 0;
  ${({ $edge, $gap }) => `${$edge}: -${$gap > 0 ? 6 + $gap / 2 : 5}px;`}
  width: 10px;
  outline: none;
  cursor: col-resize;
  touch-action: none;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 32px;
    border-radius: 2px;
    background: var(--color-label-disabled);
    transform: translate(-50%, -50%);
  }

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

  &:hover::after {
    opacity: 1;
  }
`;

type PanelResizeHandleProps = {
  edge: "left" | "right";
  gap?: number;
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  onResize: (delta: number) => void;
  previewProperty?: `--${string}`;
};

export function PanelResizeHandle({
  edge,
  gap = 0,
  label,
  value,
  minimum,
  maximum,
  onResize,
  previewProperty,
}: PanelResizeHandleProps) {
  const [active, setActive] = useState(false);
  const lastPointerX = useRef(0);
  const cleanupDrag = useRef<(() => void) | null>(null);
  const previewTarget = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (previewProperty) previewTarget.current?.style.removeProperty(previewProperty);
  }, [value, previewProperty]);

  useEffect(() => {
    return () => {
      cleanupDrag.current?.();
    };
  }, []);

  const beginResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    cleanupDrag.current?.();
    lastPointerX.current = event.clientX;
    setActive(true);

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const target = previewProperty ? event.currentTarget.closest<HTMLElement>("[data-resize-layout]") : null;
    previewTarget.current = target;
    let pendingWidth = value;
    let appliedWidth = value;
    let frame: number | null = null;
    const flush = () => {
      frame = null;
      if (target && previewProperty) target.style.setProperty(previewProperty, `${pendingWidth}px`);
      else if (pendingWidth !== appliedWidth) { onResize(pendingWidth - appliedWidth); appliedWidth = pendingWidth; }
    };
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      const pointerDelta = moveEvent.clientX - lastPointerX.current;
      lastPointerX.current = moveEvent.clientX;
      pendingWidth = Math.max(minimum, Math.min(maximum, pendingWidth + (edge === "right" ? pointerDelta : -pointerDelta)));
      if (frame === null) frame = requestAnimationFrame(flush);
    };

    const finishResize = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", finishResize);
      if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
      flush();
      if (target && previewProperty && pendingWidth !== value) onResize(pendingWidth - value);
      document.body.style.userSelect = previousUserSelect;
      cleanupDrag.current = null;
      setActive(false);
    };

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
      $gap={gap}
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
