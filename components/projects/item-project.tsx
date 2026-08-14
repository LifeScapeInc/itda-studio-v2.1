"use client";

import { Trash2 } from "lucide-react";
import styled from "styled-components";
import { LabelDraft } from "@/components/ui/label-draft";
import { getProjectWorkTypeLabel, type StudioProject } from "@/stores/useProjectStore";
import { ProjectPreview } from "./project-preview";

const Item = styled.article`
  position: relative;
  width: 332px;
  height: 335px;
`;

const Card = styled.button<{
  $active: boolean;
}>`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 1px solid ${({
  $active
}) => $active ? "var(--color-main-primary)" : "var(--color-border)"};
  border-radius: 12px;
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &:hover {
    border-color: var(--color-main-primary);
    box-shadow: 0 10px 26px rgb(32 29 23 / 10%);
    transform: translateY(-3px);
  }

  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: 2px solid var(--color-main-primary);
    outline-offset: 3px;
  }

  & > span:last-child {
    right: 18px;
    bottom: var(--space-sm);
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  z-index: 3;
  top: 28px;
  right: 28px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
  color: var(--color-label-studio-comment);
  cursor: pointer;
  box-shadow: 0 3px 10px rgb(32 29 23 / 10%);
  transition:
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;

  &:hover,
  &:focus-visible {
    border-color: #a33c2a;
    outline: none;
    color: #a33c2a;
    transform: translateY(-1px);
  }
`;
const Previews = styled.span`
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  display: flex;
  width: 300px;
  height: 214px;
  gap: var(--space-sm);
`;
const Preview = styled.span`
  display: block;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  background: var(--color-main-neutral);
`;
const MainPreview = styled(Preview)`
  width: 180px;
  flex: 0 0 180px;
`;
const PreviewStack = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-sm);

  & > span {
    height: 99px;
    flex: 0 0 99px;
  }
`;
const Copy = styled.span`
  position: absolute;
  top: 246px;
  left: var(--space-sm);
  display: flex;
  width: 300px;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-xs);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:not(:first-child) {
    padding-right: 56px;
    color: var(--color-label-studio-comment);
  }
`;
type ItemProjectProps = {
  project: StudioProject;
  previewImages?: string[];
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
};
export function ItemProject({
  project,
  previewImages = project.previewImages,
  active,
  onOpen,
  onDelete,
}: ItemProjectProps) {
  return (
    <Item>
      <Card
        $active={active}
        aria-pressed={active}
        aria-label={`${project.projectName} 프로젝트 열기`}
        onDoubleClick={onOpen}
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
      <DeleteButton
        type="button"
        aria-label={`${project.projectName} 프로젝트 삭제`}
        onClick={onDelete}
      >
        <Trash2
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </DeleteButton>
    </Item>
  );
}
