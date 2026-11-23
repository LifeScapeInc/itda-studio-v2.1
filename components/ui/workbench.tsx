"use client";

import styled from "styled-components";
import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

export function handleTabKeys(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]?.click();
  tabs[next]?.focus();
}

export const IconAction = styled.button`
  position: relative;
  display: inline-flex;
  width: 24px;
  height: 28px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  padding: 0;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;
  svg { width: 16px; height: 16px; flex: none; }
  &:hover:not(:disabled) { background: var(--color-main-neutral-light); color: var(--color-label-studio-black); }
  &:disabled { opacity: .4; cursor: default; }
`;
// Compensate for the button padding and the X path's inset in its SVG viewBox.
// Keep the full hit area while aligning the visible stroke to the header inset.
export const ModalCloseAction = styled(IconAction)`
  margin-right: -8px;
`;

export const PanelTabs = styled.div`
  display: flex;
  flex: 0 0 40px;
  min-height: 40px;
  align-items: stretch;
  background: var(--color-main-neutral);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
`;
export const PanelTab = styled.button.attrs({ className: "type-xsmall-body" })<{ $active: boolean; }>`
  position: relative;
  z-index: ${({ $active }) => $active ? 1 : 0};
  border: 0;
  border-radius: 7px 7px 0 0;
  padding: 0 16px;
  background: ${({ $active }) => $active ? "var(--color-surface)" : "transparent"};
  color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"};
  white-space: nowrap;
  cursor: pointer;
  &::after { content: ""; position: absolute; right: -7px; bottom: 0; width: 7px; height: 7px; border-bottom-left-radius: 7px; box-shadow: ${({ $active }) => $active ? "-2px 2px 0 2px var(--color-surface)" : "none"}; pointer-events: none; }
  &:hover { color: var(--color-label-studio-black); }
`;
export const WorkbenchSectionHeader = styled.div`
  display: flex;
  min-height: 40px;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 400;
  > button:first-child { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
`;

export function SectionToggle({ open, label, onToggle }: { open: boolean; label: string; onToggle: () => void }) {
  const caption = `${label} ${open ? "접기" : "펼치기"}`;
  return <IconAction title={caption} aria-label={caption} aria-expanded={open} onClick={onToggle}><ChevronDown style={{ transform: open ? "rotate(180deg)" : undefined }} /></IconAction>;
}
