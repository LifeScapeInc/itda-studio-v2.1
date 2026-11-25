"use client";

import { useCallback, useState } from "react";
import { ContextMenu } from "@/components/ui/context-menu";
import { Copy as CopyIcon, Trash2 } from "lucide-react";
import styled from "styled-components";
import { LabelDraft } from "@/components/ui/label-draft";
import { getProjectWorkTypeLabel, type StudioProject } from "@/stores/useProjectStore";
import { ProjectPreview } from "./project-preview";

const Item = styled.article`
position: relative; width: 100%; height: 280px;
`;

const Card = styled.button<{
  $active: boolean;
}>`
position: relative; display: flex; width: 100%; height: 100%; flex-direction: column; gap: 12px; padding: 12px;
 border: 1px solid ${({ $active }) => $active ? "var(--color-main-primary)" : "var(--color-border)"};
 border-radius: var(--radius-panel); background: var(--color-surface); text-align: left; cursor: pointer;
 &:hover { background: var(--color-main-neutral-light); }
 > span:last-child { right: 12px; bottom: 12px; width: 36px; height: 22px; font-size: 12px; }
`;

const Previews = styled.span`
display: flex; width: 100%; height: 164px; flex: 0 0 164px; gap: 8px;
`;
const Preview = styled.span`
  position: relative;
  display: block;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: var(--radius-panel);
  background: var(--color-main-neutral);
`;
const MainPreview = styled(Preview)`
width: 62%; flex: 0 0 62%;
`;
const PreviewStack = styled.span`
display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 8px; > span { flex: 1; min-height: 0; }
`;
const Copy = styled.span`
display: flex; width: 100%; min-width: 0; flex-direction: column; gap: 8px;
 span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
 span:not(:first-child) { padding-right: 48px; color: var(--color-label-studio-comment); }
`;
type ItemProjectProps = {
  project: StudioProject;
  previewImages?: string[];
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  duplicating?: boolean;
};
export function ItemProject({
  project,
  previewImages = project.previewImages,
  active,
  onOpen,
  onDelete,
  onDuplicate,
  duplicating = false,
}: ItemProjectProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  return (
    <Item onContextMenu={event => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); }}>

      <Card
        $active={active}
        aria-pressed={active}
        aria-label={`${project.projectName} 프로젝트 열기`}
        onDoubleClick={onOpen}
        onKeyDown={event => {
          if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setMenu({ x: rect.left + 16, y: rect.top + 16 }); }
          else if (event.key === "Enter") { event.preventDefault(); onOpen(); }
        }}
      >
        <Previews>
          <MainPreview>
            <ProjectPreview
              project={project}
              imageUrl={previewImages[0]}
              index={0}
            />
          </MainPreview>
          <PreviewStack>
            <Preview>
              <ProjectPreview
                project={project}
                imageUrl={previewImages[1]}
                index={1}
              />
            </Preview>
            <Preview>
              <ProjectPreview
                project={project}
                imageUrl={previewImages[2]}
                index={2}
              />
            </Preview>
          </PreviewStack>
        </Previews>
        <Copy>
          <span className="type-xsmall-body">
            {project.projectName}
          </span>
          <span className="type-xsmall-thin">
            {project.email || "이메일 미입력"}
          </span>
          <span className="type-xsmall-thin">
            {getProjectWorkTypeLabel(project.workType)}
          </span>
        </Copy>
        <LabelDraft variant={project.stage} />
      </Card>
      {menu && <ContextMenu x={menu.x} y={menu.y} height={76} label="프로젝트 메뉴" onClose={closeMenu}>
        <button type="button" role="menuitem" disabled={duplicating} onClick={() => { closeMenu(); onDuplicate(); }}><CopyIcon />프로젝트 복제</button>
        <button type="button" role="menuitem" disabled={duplicating} onClick={() => { closeMenu(); onDelete(); }}><Trash2 />삭제</button>
      </ContextMenu>}
    </Item>
  );
}
