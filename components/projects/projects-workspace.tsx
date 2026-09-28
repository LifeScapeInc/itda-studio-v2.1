"use client";

import { FolderOpen, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { StudioShell, WorkspaceContent, HiddenScrollbar } from "@/system/styles/layout";
import { useCreateStore } from "@/stores/useCreateStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useProjectStore, type StudioProject } from "@/stores/useProjectStore";
import { ItemProject } from "./item-project";
import { ProjectCreateOverlay } from "./project-create-overlay";
import { ProjectDeleteOverlay } from "./project-delete-overlay";

const Content = styled(WorkspaceContent)`
  gap: 28px;
`;
const Header = styled.header`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  h1 { font-size: 27px; font-weight: 700; letter-spacing: -.8px; line-height: 1.3; }
  p { margin-top: 8px; color: var(--color-label-studio-comment); font-size: 13px; line-height: 1.5; }
`;
const NewButton = styled.button`
  display: inline-flex;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 15px;
  border: 1px solid var(--color-label-studio-black);
  border-radius: 7px;
  background: var(--color-label-studio-black);
  color: var(--color-surface);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: .85; }
`;
const Toolbar = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border);
`;
const Tabs = styled.div`
  display: flex;
  align-self: stretch;
  gap: 24px;
`;
const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: -1px;
  padding: 13px 1px 16px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => $active ? "var(--color-label-studio-black)" : "transparent"};
  background: transparent;
  color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"};
  font-size: 12px;
  font-weight: ${({ $active }) => $active ? 650 : 450};
  white-space: nowrap;
  cursor: pointer;
  span { color: var(--color-label-studio-comment); font-size: 11px; font-variant-numeric: tabular-nums; }
`;
const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
`;
const SearchBox = styled.div`
  display: flex;
  width: 190px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-label-studio-comment);
  input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; color: var(--color-label-studio-black); font: inherit; font-size: 11px; }
  &:focus-within { outline: 2px solid var(--color-main-primary); outline-offset: 1px; }
  button { display: grid; padding: 0; place-items: center; border: 0; background: none; cursor: pointer; }
`;
const Sort = styled.select`
  max-width: 104px;
  border: 0;
  padding: 6px 3px;
  background: transparent;
  color: var(--color-label-studio-comment);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
`;
const ViewSwitch = styled.div`
  display: flex;
  gap: 2px;
`;
const ViewButton = styled.button<{ $active: boolean }>`
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: ${({ $active }) => $active ? "var(--color-main-neutral)" : "transparent"};
  color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"};
  cursor: pointer;
`;
const Scroll = styled(HiddenScrollbar)`
  min-height: 0;
  flex: 1;
  margin-top: -10px;
  overflow: auto;
  padding: 2px 2px 24px;
`;
const Grid = styled.section<{ $view: "grid" | "list" }>`
  display: grid;
  grid-template-columns: ${({ $view }) => $view === "list" ? "1fr" : "repeat(auto-fill, minmax(250px, 1fr))"};
  align-content: start;
  gap: ${({ $view }) => $view === "list" ? "12px" : "22px"};
`;
const Empty = styled.div`
  display: flex;
  min-height: 290px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-label-studio-comment);
  h2 { margin-top: 4px; color: var(--color-label-studio-black); font-size: 16px; font-weight: 600; }
  p { font-size: 12px; }
  button { margin-top: 8px; }
`;

type ProjectFilter = "all" | "draft" | "final";
type SortOrder = "updated" | "created" | "name";

export function ProjectsWorkspace() {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudioProject | null>(null);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("updated");
  const [view, setView] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const active = useProjectStore((state) => state.activeProjectId);
  const openProject = useProjectStore((state) => state.openProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const generationHistory = useCreateStore((state) => state.generationHistory);
  const hydrateLibrary = useCreateStore((state) => state.hydrateLibrary);
  const setProjectContext = useCreateStore((state) => state.setProjectContext);
  const setDetailProjectContext = useDetailPageStore((state) => state.setProjectContext);

  useEffect(() => { void hydrateLibrary(); }, [hydrateLibrary]);

  const previews = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const history of generationHistory) {
      if (!history.projectId) continue;
      const images = result.get(history.projectId) ?? [];
      for (const shot of history.shots) {
        if (shot.status === "done" && shot.imageUrl && images.length < 3) images.push(shot.imageUrl);
      }
      result.set(history.projectId, images);
    }
    return result;
  }, [generationHistory]);

  const visibleProjects = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ko-KR");
    return projects.filter((project) => (
      (filter === "all" || project.stage === filter)
      && (!search || [project.projectName, project.description, project.company, project.manager, project.email]
        .filter(Boolean).join(" ").toLocaleLowerCase("ko-KR").includes(search))
    )).sort((a, b) => {
      if (sort === "name") return a.projectName.localeCompare(b.projectName, "ko-KR");
      const key = sort === "created" ? "createdAt" : "updatedAt";
      return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    });
  }, [projects, query, filter, sort]);

  const tabs: { value: ProjectFilter; label: string; count: number }[] = [
    { value: "all", label: "전체", count: projects.length },
    { value: "draft", label: "진행 중", count: projects.filter((project) => project.stage === "draft").length },
    { value: "final", label: "최종본", count: projects.filter((project) => project.stage === "final").length },
  ];

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Content>
        <Header><div><h1>프로젝트</h1><p>아이디어부터 완성까지, 작업을 한곳에 모아 보세요.</p></div><NewButton type="button" onClick={() => setOpen(true)}><Plus size={15} />새 프로젝트</NewButton></Header>
        <Toolbar>
          <Tabs aria-label="프로젝트 상태 필터">{tabs.map((tab) => <Tab key={tab.value} type="button" $active={filter === tab.value} aria-pressed={filter === tab.value} onClick={() => setFilter(tab.value)}>{tab.label}<span>{tab.count}</span></Tab>)}</Tabs>
          <Tools>
            <SearchBox><Search size={14} aria-hidden="true" /><input aria-label="프로젝트 검색" placeholder="프로젝트 검색" value={query} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={12} /></button> : null}</SearchBox>
            <Sort aria-label="프로젝트 정렬" value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}><option value="updated">최근 수정순</option><option value="created">최근 생성순</option><option value="name">이름순</option></Sort>
            <ViewSwitch aria-label="프로젝트 보기 방식"><ViewButton type="button" aria-label="카드 보기" aria-pressed={view === "grid"} $active={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={15} /></ViewButton><ViewButton type="button" aria-label="목록 보기" aria-pressed={view === "list"} $active={view === "list"} onClick={() => setView("list")}><List size={17} /></ViewButton></ViewSwitch>
          </Tools>
        </Toolbar>
        <Scroll>
          {visibleProjects.length ? <Grid $view={view} aria-label="프로젝트 목록">
            {visibleProjects.map((project) => <ItemProject key={project.id} project={project} previewImages={previews.get(project.id)} active={project.id === active} view={view} onOpen={() => {
              if (project.workType === "detail_page") setDetailProjectContext(project.id);
              else setProjectContext(project.id);
              openProject(project.id);
              router.push(`${project.workType === "detail_page" ? "/detail-page" : "/create"}?projectId=${encodeURIComponent(project.id)}`);
            }} onDelete={() => setDeleteTarget(project)} />)}
          </Grid> : <Empty><FolderOpen size={32} strokeWidth={1.3} /><h2>{projects.length ? "조건에 맞는 프로젝트가 없어요" : "첫 프로젝트를 시작해 보세요"}</h2><p>{projects.length ? "검색어 또는 진행 상태를 바꿔 보세요." : "제품 이미지와 상세 페이지 작업을 프로젝트로 관리하세요."}</p>{!projects.length ? <NewButton type="button" onClick={() => setOpen(true)}><Plus size={15} />새 프로젝트</NewButton> : null}</Empty>}
        </Scroll>
      </Content>
      {open ? <ProjectCreateOverlay onClose={() => setOpen(false)} onCreated={() => { setOpen(false); setFilter("all"); setQuery(""); setSort("created"); }} /> : null}
      {deleteTarget ? <ProjectDeleteOverlay project={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={() => { deleteProject(deleteTarget.id); setDeleteTarget(null); }} /> : null}
    </StudioShell>
  );
}
