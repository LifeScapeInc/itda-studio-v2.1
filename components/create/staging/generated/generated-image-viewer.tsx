"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import styled from "styled-components";
import { TooltipIconAction } from "@/components/ui/tooltip-icon-action";

const Viewport = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  &:active { cursor: grabbing; }
`;
const Picture = styled.img`
  position: absolute;
  inset: 24px;
  width: calc(100% - 48px);
  height: calc(100% - 48px);
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;
const Tools = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  font-size: 12px;
  cursor: default;
`;
const limit = (scale: number) => Math.max(.25, Math.min(8, scale));

export function GeneratedImageViewer({ src, alt, onBack }: { src: string; alt: string; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const reset = () => setView({ scale: 1, x: 0, y: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      setView(previous => {
        const scale = limit(previous.scale * Math.exp(-event.deltaY * .002));
        const ratio = scale / previous.scale;
        return { scale, x: x - (x - previous.x) * ratio, y: y - (y - previous.y) * ratio };
      });
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, []);
  return <Viewport ref={ref} tabIndex={0} aria-label="생성 이미지 확대 및 이동"
    onPointerDown={event => {
      if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
      drag.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      if (!drag.current) return;
      const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
      drag.current = { x: event.clientX, y: event.clientY };
      setView(previous => ({ ...previous, x: previous.x + dx, y: previous.y + dy }));
    }}
    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => {
      if ((event.target as HTMLElement).closest("button")) return;
      if (event.key === "Escape") { event.stopPropagation(); onBack(); }
      else if (event.key === "0") reset();
      else if (["+", "=", "-"].includes(event.key)) setView(previous => ({ ...previous, scale: limit(previous.scale * (event.key === "-" ? 1 / 1.2 : 1.2)) }));
      else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setView(previous => ({ ...previous, x: previous.x + (event.key === "ArrowLeft" ? -30 : event.key === "ArrowRight" ? 30 : 0), y: previous.y + (event.key === "ArrowUp" ? -30 : event.key === "ArrowDown" ? 30 : 0) }));
      }
    }}>
    <Picture src={src} alt={alt} draggable={false} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
    <Tools>
      <TooltipIconAction caption="축소" onClick={() => setView(previous => ({ ...previous, scale: limit(previous.scale / 1.2) }))}><ZoomOut /></TooltipIconAction>
      <span>{Math.round(view.scale * 100)}%</span>
      <TooltipIconAction caption="확대" onClick={() => setView(previous => ({ ...previous, scale: limit(previous.scale * 1.2) }))}><ZoomIn /></TooltipIconAction>
      <TooltipIconAction caption="화면에 맞추기" onClick={reset}><RotateCcw /></TooltipIconAction>
    </Tools>
  </Viewport>;
}
