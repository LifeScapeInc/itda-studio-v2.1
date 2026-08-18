"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import styled from "styled-components";

const Root = styled.button<{
  $fullWidth: boolean;
  $height: number;
}>`
  display: inline-flex;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "fit-content")};
  height: ${({ $height }) => $height}px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: 0 var(--space-lg);
  border: 0;
  border-radius: 8px;
  background: var(--color-main-primary);
  color: var(--color-surface);
  cursor: pointer;
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }

  &:hover:not(:disabled) {
    background: var(--color-main-secondary);
  }

  &:disabled {
    background: var(--color-label-disabled);
    cursor: default;
  }
`;

type PrimaryIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  icon: LucideIcon;
  iconClassName?: string;
  iconPosition?: "start" | "end";
  iconSize?: number;
  fullWidth?: boolean;
  height?: number;
  labelClassName?: string;
  children: ReactNode;
};

export function PrimaryIconButton({
  icon: Icon,
  iconClassName,
  iconPosition = "start",
  iconSize = 16,
  fullWidth = false,
  height = 40,
  labelClassName,
  children,
  ...buttonProps
}: PrimaryIconButtonProps) {
  const vector = (
    <Icon
      size={iconSize}
      className={iconClassName}
      aria-hidden="true"
    />
  );

  return (
    <Root $fullWidth={fullWidth} $height={height} {...buttonProps}>
      {iconPosition === "start" ? vector : null}
      <span className={labelClassName}>{children}</span>
      {iconPosition === "end" ? vector : null}
    </Root>
  );
}
