"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import styled from "styled-components";
import { COMPOSITION_OPTIONS, type GenerationComposition } from "@/system/create/generation-batch";

const VALUES = COMPOSITION_OPTIONS.map(option => option.id);
const PREVIEWS: Record<GenerationComposition, { description: string; image: string }> = {
  standard: { description: "눈높이 정면에서 제품 전체를 균형 있게 담습니다.", image: "pers_1.webp" },
  three_quarter: { description: "앞면과 옆면을 함께 담아 입체감을 표현합니다.", image: "pers_2.png" },
  side: { description: "제품의 옆모습과 깊이를 중심으로 담습니다.", image: "pers_3.png" },
  detail: { description: "소재와 마감의 특징이 보이도록 가까이 담습니다.", image: "pers_4.webp" },
  environmental: { description: "주변 공간과 함께 제품의 크기와 배치를 보여줍니다.", image: "pers_5.webp" },
  reverse: { description: "공간 반대편에서 제품을 바라보며 촬영합니다.", image: "pers_6.webp" },
  low_angle: { description: "낮은 위치에서 올려다보며 제품의 존재감을 강조합니다.", image: "pers_7.webp" },
};

const Trigger = styled.button`
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  width: 100%; height: 28px; padding: 0 4px 0 8px; border: 0; border-radius: 4px;
  background: transparent; color: inherit; font: inherit; cursor: pointer;
  &:hover:not(:disabled) { background: var(--color-main-neutral-light); }
  &:disabled { cursor: default; opacity: .5; }
  svg { width: 10px; height: 10px; color: var(--color-label-studio-comment); }
`;
const Menu = styled.div`
  position: fixed; z-index: 200; width: min(320px, calc(100vw - 16px)); padding: 4px;
  max-height: calc(100dvh - 16px); overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px;
  border: 1px solid var(--color-border);
  border-radius: 4px; background: var(--color-surface);
  box-shadow: 0 4px 16px rgb(32 29 23 / 16%);
`;
const Option = styled.div<{ $active: boolean }>`
  display: flex; flex: 0 0 88px; height: 88px; align-items: center; gap: 12px;
  padding: 0 0 0 12px; border-radius: 4px; cursor: pointer; overflow: hidden;
  background: ${({ $active }) => $active ? "var(--color-main-neutral-light)" : "transparent"};
`;
const Copy = styled.span`
  display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px;
  strong { font-size: 13px; font-weight: 500; }
  span { font-size: 12px; font-weight: 400; line-height: 1.5; color: var(--color-label-studio-comment); }
`;
const Photo = styled(Image)`width: 132px; height: 88px; flex: 0 0 132px; object-fit: cover; border-radius: 4px;`;

export function CompositionDropdown({ value, onChange, disabled, label }: { value: GenerationComposition; onChange: (value: GenerationComposition) => void; disabled: boolean; label: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (position) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, position, id]);
  const close = () => setPosition(null);
  const choose = (index: number) => { onChange(VALUES[index]); close(); trigger.current?.focus(); };
  const open = () => {
    if (!trigger.current || disabled) return;
    const rect = trigger.current.getBoundingClientRect();
    const height = 638;
    setActive(VALUES.indexOf(value));
    setPosition({ left: Math.max(8, Math.min(window.innerWidth - 328, rect.right - 320)), top: rect.bottom + height + 4 <= window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - Math.min(height, window.innerHeight - 16) - 4) });
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
      const index = Math.max(0, Math.min(VALUES.length - 1, VALUES.indexOf(value) + Math.sign(total)));
      total = 0;
      if (VALUES[index] !== value) onChange(VALUES[index]);
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
          else setActive(index => event.key === "Home" ? 0 : event.key === "End" ? VALUES.length - 1 : Math.max(0, Math.min(VALUES.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
        } else if (event.key === "Escape") { event.stopPropagation(); close(); }
        else if (position && ["Enter", " "].includes(event.key)) { event.preventDefault(); choose(active); }
      }}><span>{COMPOSITION_OPTIONS.find(option => option.id === value)?.label}</span><ChevronDown /></Trigger>
    {position && createPortal(<Menu ref={menu} id={id} role="listbox" aria-label={label} style={position} onMouseDown={event => event.preventDefault()}>
      {COMPOSITION_OPTIONS.map((option, index) => <Option key={option.id} id={`${id}-${index}`} role="option" aria-selected={option.id === value} $active={active === index} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
        <Copy><strong>{option.label}</strong><span>{PREVIEWS[option.id].description}</span></Copy>
        <Photo src={`/assets/create/${PREVIEWS[option.id].image}`} alt={`${option.label} 구도 견본`} width={132} height={88} sizes="132px" />
      </Option>)}
    </Menu>, document.body)}
  </>;
}
