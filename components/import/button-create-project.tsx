"use client";

import styled from "styled-components";
export const CreateProjectButton = styled.button`display:grid;width:180px;height:52px;flex:0 0 180px;place-items:center;border:0;border-radius:10px;background:var(--color-main-primary);color:var(--color-surface);cursor:pointer;&:hover,&:focus-visible{outline:2px solid var(--color-main-secondary);outline-offset:2px}&:disabled{background:var(--color-label-disabled);cursor:default;outline:none}`;
export function ButtonCreateProject({
  disabled = false,
  onClick
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <CreateProjectButton
      className="type-small-body"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      프로젝트 생성
    </CreateProjectButton>
  );
}
