"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import {
  MATERIAL_PANEL_MAX_WIDTH,
  MATERIAL_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";

const Panel = styled.aside`
  position: relative;
  display: flex;
  min-width: ${MATERIAL_PANEL_MIN_WIDTH}px;
  min-height: 0;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  height: 40px;
  flex: 0 0 40px;
  align-items: center;
  padding: 0 var(--space-md);
  border-bottom: 0;
`;

const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 16px;
  padding: 0 16px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Section = styled.section`
  display: flex;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  padding-bottom: 8px;
  border: 0;
  border-radius: 0;
  background: var(--color-surface);
`;

const SectionTitle = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2xs);
  min-height: 32px;
  > button:first-child { display: flex; flex: 1; min-width: 0; align-items: center; gap: 8px; padding: 0; border: 0; background: transparent; text-align: left; font-size: 14px; font-weight: 400; cursor: pointer; }
  svg { color: var(--color-label-studio-comment); }
`;

export function MaterialPreparationLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const materialPanelWidth = useWorkspaceLayoutStore(
    state => state.materialPanelWidth,
  );
  const resizeMaterialPanel = useWorkspaceLayoutStore(
    state => state.resizeMaterialPanel,
  );

  return (
    <Panel>
      <PanelResizeHandle previewProperty="--material-width" gap={8}
        edge="right"
        label={`${title} 너비 조절`}
        value={materialPanelWidth}
        minimum={MATERIAL_PANEL_MIN_WIDTH}
        maximum={MATERIAL_PANEL_MAX_WIDTH}
        onResize={resizeMaterialPanel}
      />
      <Header>
        <h2 className="type-xsmall-body">{title}</h2>
      </Header>
      <Body>{children}</Body>
    </Panel>
  );
}

export function MaterialPreparationSection({
  title,
  children,
  actions,
}: {
  index: number;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Section>
      <SectionTitle>
        <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{title}</button>
        {actions}
      </SectionTitle>
      {open && children}
    </Section>
  );
}
