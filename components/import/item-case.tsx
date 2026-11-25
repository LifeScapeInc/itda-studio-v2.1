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
position: relative; display: flex; width: 100%; min-height: 112px; align-items: center; gap: 12px; padding: 12px;
 border: 1px solid ${({ $state }) => $state === "focused" ? "var(--color-main-primary)" : "var(--color-border)"};
 border-radius: var(--radius-panel); background: ${({ $state }) => $state === "focused" ? "var(--color-main-neutral)" : "var(--color-surface)"};
 text-align: left; cursor: ${({ $state }) => $state === "disabled" ? "default" : "pointer"};
 opacity: ${({ $state }) => $state === "disabled" ? .55 : 1};
 &:hover:not(:disabled) { background: var(--color-main-neutral-light); }
 > span:last-child { right: 12px; bottom: 12px; font-size: 12px; width: 36px; height: 22px; }
`;

const Placeholder = styled.span<{
  $disabled: boolean;
}>`
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-panel);
  background: ${({ $disabled }) => (
    $disabled ? "var(--color-main-neutral-light)" : "var(--color-main-neutral)"
  )};

  svg {
    width: 28px;
    height: 28px;
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
  padding-right: 36px;

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
