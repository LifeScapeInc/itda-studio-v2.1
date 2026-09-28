"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getProjectWorkTypeLabel, type StudioProject } from "@/stores/useProjectStore";
import { ProjectPreview } from "./project-preview";

const Item = styled.article<{ $list: boolean }>`
  position: relative;
  min-width: 0;
  ${({ $list }) => $list ? "width: 100%;" : ""}
`;
const Card = styled.button<{ $active: boolean; $list: boolean }>`
  display: ${({ $list }) => $list ? "grid" : "flex"};
  grid-template-columns: 160px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${({ $active }) => $active ? "var(--color-main-primary)" : "var(--color-border)"};
  border-radius: 10px;
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  &:hover { border-color: var(--color-label-studio-comment); box-shadow: 0 5px 20px rgb(20 19 17 / 6%); transform: translateY(-2px); }
  &:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 3px; }
`;
const Preview = styled.span<{ $list: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: ${({ $list }) => $list ? "auto" : "16 / 9"};
  min-height: ${({ $list }) => $list ? "116px" : "0"};
  overflow: hidden;
  background: var(--color-main-neutral);
`;
const Copy = styled.span`
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 16px;
`;
const Title = styled.span`
  overflow: hidden;
  padding-right: 26px;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Description = styled.span`
  overflow: hidden;
  margin-top: 5px;
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Meta = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  color: var(--color-label-studio-comment);
  font-size: 11px;
`;
const Owner = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
const Avatar = styled.span`
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-main-neutral);
  color: var(--color-main-primary);
  font-size: 10px;
  font-weight: 650;
`;
const DateLabel = styled.time`
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
`;
const Stage = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  border-radius: 5px;
  padding: 4px 7px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  color: var(--color-label-studio-black);
  font-size: 10px;
  line-height: 1;
`;
const MenuContainer = styled.div<{ $list: boolean }>`
  position: absolute;
  z-index: 3;
  top: ${({ $list }) => $list ? "14px" : "auto"};
  right: 12px;
  bottom: ${({ $list }) => $list ? "auto" : "94px"};
`;
const MenuToggle = styled.button`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;
  &:hover { background: var(--color-main-neutral); color: var(--color-label-studio-black); }
`;
const Menu = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  width: 142px;
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: 0 8px 25px rgb(20 19 17 / 12%);
  button {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 4px;
    padding: 9px;
    background: transparent;
    color: #b54b3b;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  button:hover { background: var(--color-main-neutral-light); }
`;

type ItemProjectProps = {
  project: StudioProject;
  previewImages?: string[];
  active: boolean;
  view?: "grid" | "list";
  onOpen: () => void;
  onDelete: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function ItemProject({ project, previewImages = project.previewImages, active, view = "grid", onOpen, onDelete }: ItemProjectProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isList = view === "list";

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); toggleRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [menuOpen]);

  return (
    <Item $list={isList}>
      <Card type="button" $active={active} $list={isList} aria-label={`${project.projectName} 프로젝트 열기`} onClick={onOpen}>
        <Preview $list={isList}>
          <ProjectPreview project={project} imageUrl={previewImages[0]} index={0} />
          <Stage>{project.stage === "final" ? "최종본" : "진행 중"}</Stage>
        </Preview>
        <Copy>
          <Title>{project.projectName}</Title>
          <Description>{project.description || [project.company, getProjectWorkTypeLabel(project.workType)].filter(Boolean).join(" · ")}</Description>
          <Meta>
            <Owner><Avatar>{(project.manager || project.company || "IT").slice(0, 2)}</Avatar><span>{project.manager || "개인 작업"}</span></Owner>
            <DateLabel dateTime={project.updatedAt} title="최근 수정일">{formatDate(project.updatedAt)}</DateLabel>
          </Meta>
        </Copy>
      </Card>
      <MenuContainer ref={menuRef} $list={isList}>
        <MenuToggle ref={toggleRef} type="button" aria-label={`${project.projectName} 프로젝트 메뉴`} aria-expanded={menuOpen} aria-controls={`project-menu-${project.id}`} onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal size={17} /></MenuToggle>
        {menuOpen ? <Menu id={`project-menu-${project.id}`}><button type="button" onClick={() => { setMenuOpen(false); onDelete(); }}><Trash2 size={14} />프로젝트 삭제</button></Menu> : null}
      </MenuContainer>
    </Item>
  );
}
