"use client";

import { useState } from "react";
import { Camera, Layers3, Settings2 } from "lucide-react";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import {
  SETTINGS_PANEL_MAX_WIDTH,
  SETTINGS_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { AngleVariationSelector } from "./angle-variation-selector";
import { CollapsibleSection } from "./collapsible-section";
import { ContentSetSelector } from "./content-set-selector";
import { ExpertSettings } from "./expert-settings";
import { GenerationAction } from "./generation-action";
import { PromptPreview } from "./prompt-preview";

const Panel = styled.aside`
  position: relative;
  display: flex;
  min-width: ${SETTINGS_PANEL_MIN_WIDTH}px;
  min-height: 0;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const ScrollArea = styled.div`
  min-height: 0;
  flex: 1;
  padding: var(--space-sm);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

export function GenerationSettingsPanel() {
  const [contentOpen, setContentOpen] = useState(true);
  const [angleOpen, setAngleOpen] = useState(false);
  const [expertOpen, setExpertOpen] = useState(false);
  const angleVariationIds = useCreateStore(
    (state) => state.angleVariationIds,
  );
  const angleVariationActive = angleVariationIds.length > 0;
  const settingsPanelWidth = useWorkspaceLayoutStore(
    (state) => state.settingsPanelWidth,
  );
  const resizeSettingsPanel = useWorkspaceLayoutStore(
    (state) => state.resizeSettingsPanel,
  );

  return (
    <Panel>
      <PanelResizeHandle
        edge="left"
        label="생성 설정 너비 조절"
        value={settingsPanelWidth}
        minimum={SETTINGS_PANEL_MIN_WIDTH}
        maximum={SETTINGS_PANEL_MAX_WIDTH}
        onResize={resizeSettingsPanel}
      />
      <Header>
        <h2 className="type-xsmall-body">생성 설정</h2>
        <PromptPreview />
      </Header>
      <ScrollArea>
        <Sections>
          <CollapsibleSection
            title="콘텐츠 세트 선택"
            icon={<Layers3 size={16} />}
            open={contentOpen}
            onToggle={() => setContentOpen((open) => !open)}
          >
            <ContentSetSelector />
          </CollapsibleSection>
          <CollapsibleSection
            title="앵글 변주"
            icon={<Camera size={16} />}
            open={angleOpen}
            onToggle={() => setAngleOpen((open) => !open)}
          >
            <AngleVariationSelector
              onActivate={() => setExpertOpen(false)}
            />
          </CollapsibleSection>
          <CollapsibleSection
            title="전문가 설정 (선택)"
            icon={<Settings2 size={16} />}
            open={expertOpen}
            disabled={angleVariationActive}
            onToggle={() => setExpertOpen((open) => !open)}
          >
            <ExpertSettings />
          </CollapsibleSection>
        </Sections>
      </ScrollArea>
      <GenerationAction />
    </Panel>
  );
}
