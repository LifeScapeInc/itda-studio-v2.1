"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useProjectStore } from "@/stores/useProjectStore";
import type { StudioProject } from "@/stores/useProjectStore";

const Tabs = styled.nav`
  position: absolute;
  z-index: 1;
  top: 0;
  right: 220px;
  bottom: 0;
  left: 203px;
  display: flex;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.div<{ $active: boolean }>`
  display: flex;
  width: 294px;
  height: 56px;
  min-width: 180px;
  flex: 0 1 294px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  background: ${({ $active }) => (
    $active ? "var(--color-surface)" : "var(--color-main-neutral)"
  )};

  &:focus-within {
    box-shadow: inset 0 -2px var(--color-main-primary);
  }
`;

const OpenLink = styled(Link)`
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  padding-left: 20px;
  color: var(--color-label-studio-black);
  font-size: 16px;
  font-weight: 500;
  line-height: 1;

  &:focus-visible {
    outline: none;
  }
`;

const Name = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Close = styled.button`
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin-right: 16px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--color-main-neutral);
  }

  img {
    width: 12px;
    height: 12px;
    opacity: 0.5;
  }
`;

function getProjectHref(project: StudioProject): string {
  const path = project.workType === "detail_page" ? "/detail-page" : "/create";
  return `${path}?projectId=${encodeURIComponent(project.id)}`;
}

export function TabProject() {
  const pathname = usePathname();
  const router = useRouter();
  const projects = useProjectStore(state => state.projects);
  const openProjectIds = useProjectStore(state => state.openProjectIds);
  const openProject = useProjectStore(state => state.openProject);
  const openUnscopedWorkspace = useProjectStore(
    state => state.openUnscopedWorkspace,
  );
  const closeProjectTab = useProjectStore(state => state.closeProjectTab);
  const setProjectContext = useCreateStore(state => state.setProjectContext);
  const setDetailProjectContext = useDetailPageStore(
    state => state.setProjectContext,
  );
  const storedActiveProjectId = useProjectStore(state => state.activeProjectId);
  const activeProjectId = pathname === "/create" || pathname === "/detail-page"
    ? storedActiveProjectId
    : null;
  const openProjects = openProjectIds
    .map(id => projects.find(project => project.id === id))
    .filter(project => project !== undefined);

  if (openProjects.length === 0) return null;

  const closeTab = (projectId: string) => {
    const currentIndex = openProjects.findIndex(project => project.id === projectId);
    const remaining = openProjects.filter(project => project.id !== projectId);
    const fallback = remaining[Math.min(currentIndex, remaining.length - 1)];
    const closingCurrentProject = activeProjectId === projectId;

    closeProjectTab(projectId);
    if (!closingCurrentProject) return;

    if (fallback) {
      if (fallback.workType === "detail_page") {
        setDetailProjectContext(fallback.id);
      } else {
        setProjectContext(fallback.id);
      }
      openProject(fallback.id);
      router.replace(getProjectHref(fallback));
      return;
    }

    if (pathname === "/detail-page") {
      setDetailProjectContext(null);
    } else {
      setProjectContext(null);
    }
    openUnscopedWorkspace();
    router.replace(pathname === "/detail-page" ? "/detail-page" : "/create");
  };

  return (
    <Tabs aria-label="열린 프로젝트">
      {openProjects.map(project => {
        const active = activeProjectId === project.id;
        return (
          <Tab $active={active} key={project.id}>
            <OpenLink
              href={getProjectHref(project)}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (project.workType === "detail_page") {
                  setDetailProjectContext(project.id);
                } else {
                  setProjectContext(project.id);
                }
                openProject(project.id);
              }}
            >
              <Name title={project.projectName}>{project.projectName}</Name>
            </OpenLink>
            <Close
              type="button"
              aria-label={`${project.projectName} 탭 닫기`}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                closeTab(project.id);
              }}
            >
              <Image
                src="/assets/project-overlay-close.svg"
                width={12}
                height={12}
                alt=""
              />
            </Close>
          </Tab>
        );
      })}
    </Tabs>
  );
}
