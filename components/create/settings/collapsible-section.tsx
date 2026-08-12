"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styled from "styled-components";

const Section = styled.section<{ $disabled: boolean }>`
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  overflow: hidden;
  opacity: ${({ $disabled }) => ($disabled ? 0.46 : 1)};
`;

const Header = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm);
  border: 0;
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

const HeaderCopy = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  text-align: left;
`;

const Chevron = styled(ChevronDown)<{ $open: boolean }>`
  width: 16px;
  height: 16px;
  color: var(--color-label-studio-comment);
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0")});
  transition: transform 160ms ease;
`;

const Body = styled.div`
  padding: 0 var(--space-sm) var(--space-sm);
`;

type CollapsibleSectionProps = {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  children,
  disabled = false,
}: CollapsibleSectionProps) {
  return (
    <Section $disabled={disabled} aria-disabled={disabled}>
      <Header
        type="button"
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
      >
        <HeaderCopy>
          {icon}
          <span className="type-xsmall-body">{title}</span>
        </HeaderCopy>
        <Chevron $open={open} aria-hidden="true" />
      </Header>
      {open ? <Body>{children}</Body> : null}
    </Section>
  );
}
