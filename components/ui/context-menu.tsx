"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

const Menu = styled.div`
  position: fixed; z-index: 210; width: 200px; padding: 4px;
  border: 1px solid var(--color-border); border-radius: 7px;
  background: var(--color-surface); box-shadow: 0 8px 24px rgb(32 29 23 / 18%);
  button { display: flex; width: 100%; height: 34px; align-items: center; gap: 10px; padding: 0 12px; border: 0; border-radius: 4px; background: transparent; color: var(--color-label-studio-black); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
  button:hover:not(:disabled) { background: var(--color-main-neutral); }
  button:disabled { opacity: .4; cursor: default; }
  svg { width: 14px; height: 14px; }
  hr { margin: 4px -4px; border: 0; border-top: 1px solid var(--color-border); }
`;

export function ContextMenu({ x, y, label, height = 190, onClose, children }: { x: number; y: number; label: string; height?: number; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) onClose(); };
    const close = () => onClose();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close); window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); previous?.focus(); };
  }, [onClose]);
  return createPortal(<Menu ref={ref} role="menu" aria-label={label} style={{ left: Math.max(8, Math.min(x, window.innerWidth - 208)), top: Math.max(8, Math.min(y, window.innerHeight - height - 8)) }}
    onContextMenu={event => event.preventDefault()} onKeyDown={event => {
      if (event.key === "Escape" || event.key === "Tab") { if (event.key === "Escape") event.preventDefault(); onClose(); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault(); const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}>
    {children}
  </Menu>, document.body);
}
