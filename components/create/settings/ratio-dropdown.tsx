"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import styled from "styled-components";
import { RATIO_OPTIONS, type BatchRatio } from "@/system/create/generation-batch";

const Trigger = styled.button`
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  width: 100%; height: 28px; padding: 0 4px 0 8px; border: 0; border-radius: 4px;
  background: transparent; color: inherit; font: inherit; cursor: pointer;
  &:hover:not(:disabled) { background: var(--color-main-neutral-light); }
  &:disabled { cursor: default; opacity: .5; }
  svg { width: 10px; height: 10px; color: var(--color-label-studio-comment); }
`;
const Menu = styled.div`
  position: fixed; z-index: 200; width: 128px; padding: 4px;
  max-height: calc(100dvh - 16px); overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid var(--color-border);
  border-radius: 4px; background: var(--color-surface);
  box-shadow: 0 4px 16px rgb(32 29 23 / 16%);
`;
const Option = styled.div<{ $active: boolean }>`
  display: flex; flex: 0 0 48px; height: 48px; align-items: center;
  padding: 8px; border-radius: 4px; font-size: 12px; cursor: pointer;
  background: ${({ $active }) => $active ? "var(--color-main-neutral-light)" : "transparent"};
  > span:first-child { width: 36px; flex: 0 0 36px; }
`;
const ShapeSlot = styled.span`
  display: flex; flex: 1; height: 32px; align-items: center; justify-content: center;
`;
const Shape = styled.span`
  display: block; border: 1.5px solid var(--color-main-primary); border-radius: 2px;
`;

export function RatioDropdown({ value, onChange, disabled, label }: { value: BatchRatio; onChange: (value: BatchRatio) => void; disabled: boolean; label: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState(0);
  const close = () => setPosition(null);
  const choose = (index: number) => { onChange(RATIO_OPTIONS[index]); close(); trigger.current?.focus(); };
  const open = () => {
    if (!trigger.current || disabled) return;
    const rect = trigger.current.getBoundingClientRect();
    const height = 308;
    setActive(RATIO_OPTIONS.indexOf(value));
    setPosition({ left: Math.max(8, Math.min(window.innerWidth - 136, rect.right - 128)), top: rect.bottom + height + 4 <= window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - Math.min(height, window.innerHeight - 16) - 4) });
  };
  useEffect(() => {
    if (!position) return;
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close(); };
    const scroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", close); window.removeEventListener("scroll", scroll, true); };
  }, [position]);
  useEffect(() => {
    const node = trigger.current;
    if (!node) return;
    let total = 0, last = 0;
    const wheel = (event: WheelEvent) => {
      if (disabled || position || event.ctrlKey || event.metaKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault(); event.stopPropagation();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      if (event.timeStamp - last > 200 || Math.sign(delta) !== Math.sign(total)) total = 0;
      total += delta; last = event.timeStamp;
      if (Math.abs(total) < 40) return;
      const index = Math.max(0, Math.min(RATIO_OPTIONS.length - 1, RATIO_OPTIONS.indexOf(value) + Math.sign(total)));
      total = 0;
      if (RATIO_OPTIONS[index] !== value) onChange(RATIO_OPTIONS[index]);
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [disabled, value, onChange, position]);
  return <>
    <Trigger ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} aria-activedescendant={position ? `${id}-${active}` : undefined} aria-haspopup="listbox" disabled={disabled}
      onClick={() => position ? close() : open()} onBlur={close}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          if (!position) open();
          else setActive(index => event.key === "Home" ? 0 : event.key === "End" ? RATIO_OPTIONS.length - 1 : Math.max(0, Math.min(RATIO_OPTIONS.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
        } else if (event.key === "Escape") { event.stopPropagation(); close(); }
        else if (position && ["Enter", " "].includes(event.key)) { event.preventDefault(); choose(active); }
      }}><span>{value}</span><ChevronDown /></Trigger>
    {position && createPortal(<Menu ref={menu} id={id} role="listbox" aria-label={label} style={position} onMouseDown={event => event.preventDefault()}>
      {RATIO_OPTIONS.map((ratio, index) => {
        const [w, h] = ratio.split(":").map(Number);
        return <Option key={ratio} id={`${id}-${index}`} role="option" aria-selected={ratio === value} $active={active === index} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
          <span>{ratio}</span><ShapeSlot aria-hidden="true"><Shape style={{ width: 32 * w / Math.max(w, h), height: 32 * h / Math.max(w, h) }} /></ShapeSlot>
        </Option>;
      })}
    </Menu>, document.body)}
  </>;
}
