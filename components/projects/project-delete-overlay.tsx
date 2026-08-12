"use client";

import styled from "styled-components";
import type { StudioProject } from "@/stores/useProjectStore";

const Backdrop = styled.div`
  position: fixed;
  z-index: 110;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-sm);
  background: rgb(32 29 23 / 28%);
`;

const Dialog = styled.section`
  display: flex;
  width: 420px;
  max-width: calc(100vw - 32px);
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border-radius: 16px;
  background: var(--color-main-neutral-light);
  box-shadow: 0 16px 48px rgb(32 29 23 / 20%);
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }

  strong {
    color: var(--color-label-studio-black);
    font-weight: 500;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-xs);

  button {
    min-width: 112px;
    height: 44px;
    padding: 0 var(--space-md);
    border: 0;
    border-radius: 8px;
    color: var(--color-surface);
    cursor: pointer;
  }
`;

const Cancel = styled.button`
  background: var(--color-label-disabled);
`;

const Delete = styled.button`
  background: #a33c2a;
`;

export function ProjectDeleteOverlay({
  project,
  onCancel,
  onConfirm,
}: {
  project: StudioProject;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <Dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="project-delete-title"
        aria-describedby="project-delete-description"
      >
        <Copy>
          <h2
            className="type-small-body"
            id="project-delete-title"
          >
            프로젝트를 삭제할까요?
          </h2>
          <p
            className="type-xsmall-body"
            id="project-delete-description"
          >
            <strong>{project.projectName}</strong> 프로젝트와 저장된 작업 내역이
            목록에서 삭제됩니다.
          </p>
        </Copy>
        <Actions>
          <Cancel
            className="type-xsmall-body"
            type="button"
            onClick={onCancel}
          >
            취소
          </Cancel>
          <Delete
            className="type-xsmall-body"
            type="button"
            autoFocus
            onClick={onConfirm}
          >
            삭제
          </Delete>
        </Actions>
      </Dialog>
    </Backdrop>
  );
}
