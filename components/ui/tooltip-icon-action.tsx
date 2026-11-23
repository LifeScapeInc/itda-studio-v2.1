"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { IconAction } from "./workbench";

const Button = styled(IconAction)`
  width: 28px;
  flex-basis: 28px;
  &:hover:not(:disabled) {
    background: var(--color-main-neutral);
  }
`;

const Caption = styled.span<{ $multiline: boolean }>`
  position: fixed;
  z-index: 200;
  display: flex;
  min-height: 30px;
  width: ${({ $multiline }) => $multiline ? "min(280px, calc(100vw - 16px))" : "auto"};
  align-items: center;
  padding: ${({ $multiline }) => $multiline ? "8px 10px" : "0 8px"};
  border-radius: 4px;
  background: var(--color-label-studio-black);
  color: var(--color-surface);
  font-size: 12px;
  font-weight: 400;
  white-space: ${({ $multiline }) => $multiline ? "normal" : "nowrap"};
  line-height: 1.6;
  pointer-events: none;
`;

export function TooltipIconAction({ caption, multiline = false, children, ...props }: Omit<ComponentProps<"button">, "title"> & { caption: string; multiline?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const hide = () => setPosition(null);
  const show = () => {
    if (!ref.current || props.disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - rect.right);
    setPosition({ top: rect.bottom + 6, right: multiline ? Math.min(right, Math.max(8, window.innerWidth - 288)) : right });
  };

  useEffect(() => {
    if (!position) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [position]);

  return <>
    <Button {...props} ref={ref} aria-label={props["aria-label"] ?? caption} aria-describedby={position ? id : undefined}
      onMouseEnter={event => { show(); props.onMouseEnter?.(event); }}
      onMouseLeave={event => { if (document.activeElement !== ref.current) hide(); props.onMouseLeave?.(event); }}
      onFocus={event => { show(); props.onFocus?.(event); }}
      onBlur={event => { hide(); props.onBlur?.(event); }}
      onClick={event => { hide(); props.onClick?.(event); }}
    >{children}</Button>
    {position && createPortal(<Caption $multiline={multiline} id={id} role="tooltip" style={position}>{caption}</Caption>, document.body)}
  </>;
}
