"use client";

import { Check } from "lucide-react";
import styled from "styled-components";
import {
  DETAIL_PAGE_STEPS,
  type DetailPageStep,
} from "@/system/detail-page/detail-page-types";

const Steps = styled.nav`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Step = styled.button<{ $active: boolean; $complete: boolean }>`
  position: relative;
  display: flex;
  min-width: 0;
  height: 48px;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  border: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-right: 0;
  }

  &:disabled {
    color: var(--color-label-disabled);
    cursor: default;
  }

  &::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: ${({ $active }) => (
      $active ? "var(--color-main-primary)" : "transparent"
    )};
    content: "";
  }
`;

const Index = styled.span<{ $active: boolean; $complete: boolean }>`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border: 1px solid ${({ $active, $complete }) => (
    $active || $complete ? "transparent" : "var(--color-border)"
  )};
  border-radius: 8px;
  background: ${({ $active, $complete }) => (
    $active
      ? "var(--color-main-secondary)"
      : $complete
        ? "var(--color-main-primary)"
        : "var(--color-surface)"
  )};
  color: ${({ $active, $complete }) => (
    $active || $complete
      ? "var(--color-surface)"
      : "inherit"
  )};
  font-size: 12px;
`;

const Copy = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);
`;

export function DetailStepNavigation({
  currentStep,
  draftReady,
  editorReady,
  onSelect,
}: {
  currentStep: DetailPageStep;
  draftReady: boolean;
  editorReady: boolean;
  onSelect: (step: DetailPageStep) => void;
}) {
  const currentIndex = DETAIL_PAGE_STEPS.find(
    step => step.id === currentStep,
  )?.index ?? 1;

  return (
    <Steps aria-label="상세 페이지 제작 단계">
      {DETAIL_PAGE_STEPS.map(step => {
        const enabled = step.id === "planning"
          || (step.id === "draft" && draftReady)
          || (step.id === "editor" && editorReady);
        const complete = step.index < currentIndex;
        return (
          <Step
            type="button"
            $active={step.id === currentStep}
            $complete={complete}
            disabled={!enabled}
            aria-current={step.id === currentStep ? "step" : undefined}
            onClick={() => onSelect(step.id)}
            key={step.id}
          >
            <Index $active={step.id === currentStep} $complete={complete}>
              {complete ? <Check size={14} /> : step.index}
            </Index>
            <Copy>
              <span className="type-xsmall-body">{step.label}</span>
            </Copy>
          </Step>
        );
      })}
    </Steps>
  );
}
