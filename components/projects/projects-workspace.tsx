"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { StudioShell, WorkspaceContent, HiddenScrollbar } from "@/system/styles/layout";
import { useCreateStore } from "@/stores/useCreateStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import {
  useProjectStore,
  type StudioProject,
} from "@/stores/useProjectStore";
import { ButtonAdd } from "./button-add";
import { ItemProject } from "./item-project";
import { ProjectCreateOverlay } from "./project-create-overlay";
import { ProjectDeleteOverlay } from "./project-delete-overlay";
const Scroll = styled(HiddenScrollbar)`min-height:0;flex:1;margin-top:var(--space-3xl);overflow:auto;padding-block:var(--space-3xs)`;
const Grid = styled.section`display:grid;grid-template-columns:repeat(auto-fill,332px);align-content:start;gap:var(--space-lg);padding-bottom:96px`;
export function ProjectsWorkspace() {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudioProject | null>(null);
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const active = useProjectStore((state) => state.activeProjectId);
  const openProject = useProjectStore((state) => state.openProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const generationHistory = useCreateStore((state) => state.generationHistory);
  const hydrateLibrary = useCreateStore((state) => state.hydrateLibrary);
  const setProjectContext = useCreateStore((state) => state.setProjectContext);
  const setDetailProjectContext = useDetailPageStore(
    (state) => state.setProjectContext,
  );

  useEffect(() => {
    void hydrateLibrary();
  }, [hydrateLibrary]);

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    deleteProject(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <LabelTitle
          title="프로젝트"
          description="카드를 더블클릭하면 이어서 작업할 수 있으며, 카드의 삭제 버튼으로 프로젝트를 삭제할 수 있습니다."
        />
        <Scroll>
          <Grid>
            {projects.map(p => (
              <ItemProject
                project={p}
                previewImages={generationHistory
                  .filter(history => history.projectId === p.id)
                  .flatMap(history => history.shots)
                  .filter(shot => shot.status === "done" && shot.imageUrl)
                  .map(shot => shot.imageUrl!)
                  .slice(0, 3)}
                active={p.id === active}
                onOpen={() => {
                  if (p.workType === "detail_page") {
                    setDetailProjectContext(p.id);
                  } else {
                    setProjectContext(p.id);
                  }
                  openProject(p.id);
                  const path = p.workType === "detail_page"
                    ? "/detail-page"
                    : "/create";
                  router.push(`${path}?projectId=${encodeURIComponent(p.id)}`);
                }}
                onDelete={() => setDeleteTarget(p)}
                key={p.id}
              />
            ))}
          </Grid>
        </Scroll>
        <ButtonAdd onClick={() => setOpen(true)} />
      </WorkspaceContent>
      {open ? <ProjectCreateOverlay onClose={() => setOpen(false)} /> : null}
      {deleteTarget ? (
        <ProjectDeleteOverlay
          project={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </StudioShell>
  );
}
