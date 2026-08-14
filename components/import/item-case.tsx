"use client";

import { Fullscreen, Scroll } from "lucide-react";
import styled from "styled-components";
import { LabelDraft } from "@/components/ui/label-draft";
import {
  getDeadlineLabel,
  getDraftVariant,
} from "@/system/import/case-presentation";
import type { IntegrationCase } from "@/system/integrations/cases";
type State = "idle" | "focused" | "disabled";

const Card = styled.button<{
  $state: State;
}>`
  position: relative;
  display: flex;
  width: 379px;
  height: 104px;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 2px solid ${({ $state }) => {
    if ($state === "focused") return "var(--color-main-secondary)";
    if ($state === "disabled") return "var(--color-label-assistive)";
    return "var(--color-border)";
  }};
  border-radius: 12px;
  background: ${({ $state }) => (
    $state === "disabled"
      ? "var(--color-label-disabled)"
      : "var(--color-surface)"
  )};
  text-align: left;
  cursor: ${({ $state }) => ($state === "disabled" ? "default" : "pointer")};

  &:hover,
  &:focus-visible {
    border-color: ${({ $state }) => (
      $state === "disabled"
        ? "var(--color-label-assistive)"
        : "var(--color-main-secondary)"
    )};
    outline: none;
  }

  & > span:last-child {
    right: var(--space-sm);
    bottom: 17px;
  }
`;

const Placeholder = styled.span<{
  $disabled: boolean;
}>`
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: ${({ $disabled }) => (
    $disabled ? "#dbdbdb" : "var(--color-main-neutral)"
  )};

  svg {
    width: 44px;
    height: 44px;
    color: var(--color-main-primary);
    opacity: ${({ $disabled }) => $disabled ? 0.48 : 1};
  }
`;

const Copy = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2xs);
  padding-right: 54px;

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:not(:first-child) {
    color: var(--color-label-studio-comment);
  }
`;
export function ItemCase({
  item,
  selected = false,
  disabled = false,
  onClick
}: {
  item: IntegrationCase;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const state: State = disabled ? "disabled" : selected ? "focused" : "idle";
  const isDetailPage = item.service_label?.trim().includes("상세") ?? false;
  return (
    <Card
      $state={state}
      type="button"
      disabled={disabled}
      aria-pressed={disabled ? undefined : selected}
      onClick={disabled ? undefined : onClick}
    >
      <Placeholder
        $disabled={disabled}
        aria-hidden="true"
      >
        {isDetailPage ? (
          <Scroll strokeWidth={1.5} />
        ) : (
          <Fullscreen strokeWidth={1.5} />
        )}
      </Placeholder>
      <Copy>
        <span className="type-xsmall-body">
          {item.case_name?.trim() || "케이스 이름 미정"}
        </span>
        <span className="type-xsmall-thin">
          {item.service_label?.trim() || "서비스 미정"}
        </span>
        <span className="type-xsmall-thin">
          {getDeadlineLabel(item.delivery_due_date)}
        </span>
      </Copy>
      <LabelDraft variant={getDraftVariant(item.status)} />
    </Card>
  );
}
