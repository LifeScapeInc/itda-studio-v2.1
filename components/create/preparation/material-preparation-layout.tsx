"use client";

import type { ReactNode } from "react";
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
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
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
  gap: var(--space-2xs);
  padding-bottom: var(--space-sm);
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-surface);
`;

const SectionTitle = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2xs);
`;

const Index = styled.span`
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-main-primary);
  color: var(--color-surface);
  font-size: 11px;
  font-weight: 700;
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
      <PanelResizeHandle
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
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Section>
      <SectionTitle>
        <Index>{index}</Index>
        <span className="type-small-head">{title}</span>
      </SectionTitle>
      {children}
    </Section>
  );
}
