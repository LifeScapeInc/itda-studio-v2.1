"use client";

import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
const Button = styled.button`
  position: absolute;
  top: 78px;
  left: 36px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: color 160ms ease, transform 160ms ease;

  &:hover {
    color: var(--color-label-studio-black);
    transform: translateX(-2px);
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--color-main-primary);
    outline-offset: 4px;
  }
`;
export function ButtonBackToCustomers({
  onClick
}: {
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      aria-label="고객 목록으로 돌아가기"
      onClick={onClick}
    >
      <ArrowLeft
        size={16}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span>
        고객 목록
      </span>
    </Button>
  );
}
