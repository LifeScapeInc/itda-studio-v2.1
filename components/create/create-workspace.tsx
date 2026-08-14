"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { StudioShell } from "@/system/styles/layout";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { useProjectStore } from "@/stores/useProjectStore";
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
  requestedProjectId,
}: {
  library: ReferenceLibraryData;
  requestedProjectId: string | null;
}) {
  const router = useRouter();
  const materialPanelWidth = useWorkspaceLayoutStore(
    (state) => state.materialPanelWidth,
  );
  const settingsPanelWidth = useWorkspaceLayoutStore(
    (state) => state.settingsPanelWidth,
  );
  const projects = useProjectStore(state => state.projects);
  const projectsHydrated = useProjectStore(state => state.hydrated);
  const openProject = useProjectStore(state => state.openProject);
  const openUnscopedWorkspace = useProjectStore(
    state => state.openUnscopedWorkspace,
  );
  const setProjectContext = useCreateStore(state => state.setProjectContext);
  const requestedProject = requestedProjectId
    ? projects.find(item => item.id === requestedProjectId)
    : null;

  useEffect(() => {
    if (!projectsHydrated) return;

    if (requestedProjectId && !requestedProject) {
      openUnscopedWorkspace();
      setProjectContext(null);
      router.replace("/create");
      return;
    }

    if (requestedProject) {
      setProjectContext(requestedProject.id);
      openProject(requestedProject.id);
      return;
    }

    openUnscopedWorkspace();
    setProjectContext(null);
  }, [
    openProject,
    openUnscopedWorkspace,
    projectsHydrated,
    requestedProject,
    requestedProjectId,
    router,
    setProjectContext,
  ]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace
        $materialWidth={materialPanelWidth}
        $settingsWidth={settingsPanelWidth}
      >
        <MaterialPreparationPanel library={library} />
        <StagingCanvas
          projectId={requestedProjectId}
          projectName={requestedProject?.projectName}
        />
        <GenerationSettingsPanel />
      </Workspace>
    </StudioShell>
  );
}
