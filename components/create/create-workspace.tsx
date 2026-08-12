"use client";

import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { StudioShell } from "@/system/styles/layout";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import type { ReferenceLibraryData } from "@/system/create/reference-library";
import { GenerationSettingsPanel } from "./settings/generation-settings-panel";
import { MaterialPreparationPanel } from "./preparation/material-preparation-panel";
import { StagingCanvas } from "./staging/staging-canvas";

const Workspace = styled.main<{
  $materialWidth: number;
  $settingsWidth: number;
}>`
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns:
    ${({ $materialWidth }) => $materialWidth}px
    minmax(0, 1fr)
    ${({ $settingsWidth }) => $settingsWidth}px;
  margin-left: var(--navigation-left-width, 203px);
  padding-top: 56px;
  overflow: hidden;
  transition: margin-left 220ms ease;
`;

export function CreateWorkspace({
  library,
}: {
  library: ReferenceLibraryData;
}) {
  const materialPanelWidth = useWorkspaceLayoutStore(
    (state) => state.materialPanelWidth,
  );
  const settingsPanelWidth = useWorkspaceLayoutStore(
    (state) => state.settingsPanelWidth,
  );

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace
        $materialWidth={materialPanelWidth}
        $settingsWidth={settingsPanelWidth}
      >
        <MaterialPreparationPanel library={library} />
        <StagingCanvas />
        <GenerationSettingsPanel />
      </Workspace>
    </StudioShell>
  );
}
