"use client";

import { useRouter } from "next/navigation";
import { reportCloudError } from "@/stores/useCloudSyncStore";
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
  const hydrateProjects = useProjectStore(state=>state.hydrate);
  const projectsHydrated = useProjectStore(state=>state.hydrated);
  const projectsLoading = useProjectStore(state=>state.loading);
  const projectError = useProjectStore(state=>state.loadError);
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
    // Refresh on page entry, including when a development update replaced the
    // store while the root layout stayed mounted.
    void hydrateProjects().catch(()=>undefined);
  }, [hydrateProjects]);

  useEffect(() => {
    void hydrateLibrary().catch(() => undefined);
  }, [hydrateLibrary]);

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try { await deleteProject(deleteTarget.id); setDeleteTarget(null); }
    catch(error){ reportCloudError(error); }
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
          {projectError ? <div role="alert"><p>{projectError}</p><button type="button" disabled={projectsLoading} onClick={()=>void hydrateProjects().catch(()=>undefined)}>다시 불러오기</button></div>
            : (!projectsHydrated||projectsLoading)&&!projects.length ? <p role="status">프로젝트를 불러오는 중…</p>
            : projectsHydrated&&!projects.length ? <p>등록된 프로젝트가 없습니다. 새 프로젝트를 추가해 주세요.</p> : null}
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
        <ButtonAdd disabled={!projectsHydrated||projectsLoading} onClick={() => setOpen(true)} />
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
