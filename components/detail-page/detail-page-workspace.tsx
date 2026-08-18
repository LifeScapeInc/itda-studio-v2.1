"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { StudioShell } from "@/system/styles/layout";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { DetailStepNavigation } from "./detail-step-navigation";
import { PlanningStage } from "./stages/planning-stage";
import { TemplateDraftStage } from "./stages/template-draft-stage";
import { TemplateEditorStage } from "./stages/template-editor-stage";

const Workspace = styled.main`
  display: flex;
  height: 100%;
  min-height: 0;
  margin-left: var(--navigation-left-width, 203px);
  padding-top: 56px;
  flex-direction: column;
  background: var(--color-surface);
  overflow: hidden;
  transition: margin-left 220ms ease;
`;

const StageViewport = styled.div<{ $editor: boolean }>`
  display: flex;
  min-height: 0;
  flex: 1;
  background: var(--color-surface);
  overflow: ${({ $editor }) => ($editor ? "hidden" : "auto")};
`;

export function DetailPageWorkspace({
  requestedProjectId,
}: {
  requestedProjectId: string | null;
}) {
  const router = useRouter();
  const detail = useDetailPageStore();
  const mockMode = useAppSettingsStore(state => state.mockMode);
  const setDetailProjectContext = detail.setProjectContext;
  const clearMockPlanning = detail.clearMockPlanning;
  const projects = useProjectStore(state => state.projects);
  const projectsHydrated = useProjectStore(state => state.hydrated);
  const openProject = useProjectStore(state => state.openProject);
  const openUnscopedWorkspace = useProjectStore(state => state.openUnscopedWorkspace);
  const requestedProject = requestedProjectId
    ? projects.find(project => project.id === requestedProjectId)
    : null;

  useEffect(() => {
    if (!projectsHydrated) return;
    if (requestedProjectId && !requestedProject) {
      setDetailProjectContext(null);
      openUnscopedWorkspace();
      router.replace("/detail-page");
      return;
    }
    if (requestedProject) {
      setDetailProjectContext(requestedProject.id);
      openProject(requestedProject.id);
      return;
    }
    setDetailProjectContext(null);
    openUnscopedWorkspace();
  }, [
    openProject,
    openUnscopedWorkspace,
    projectsHydrated,
    requestedProject,
    requestedProjectId,
    router,
    setDetailProjectContext,
  ]);

  useEffect(() => {
    if (!mockMode && detail.planningIsMock) {
      clearMockPlanning();
    }
  }, [clearMockPlanning, detail.planningIsMock, mockMode]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        <DetailStepNavigation
          currentStep={detail.step}
          draftReady={Boolean(
            detail.selectedPlanId
            && (detail.isTemplatePlanning || detail.tiles.length),
          )}
          editorReady={Boolean(detail.selectedPlanId && detail.tiles.length)}
          onSelect={detail.goToStep}
        />
        <StageViewport
          $editor={detail.step === "editor"}
        >
          {detail.step === "planning" ? <PlanningStage /> : null}
          {detail.step === "draft" ? <TemplateDraftStage /> : null}
          {detail.step === "editor" ? <TemplateEditorStage /> : null}
        </StageViewport>
      </Workspace>
    </StudioShell>
  );
}
