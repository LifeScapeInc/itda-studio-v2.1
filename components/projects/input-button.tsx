"use client";

import styled from "styled-components";
const Button = styled.button<{
  $focused: boolean;
}>`
display: inline-flex; min-height: 28px; align-items: center; justify-content: center; padding: 0 12px;
 border: 1px solid ${({ $focused }) => $focused ? "var(--color-main-primary)" : "var(--color-border)"}; border-radius: 4px;
 background: ${({ $focused }) => $focused ? "var(--color-main-neutral)" : "var(--color-surface)"}; color: var(--color-label-studio-black); font-size: 12px; font-weight: 400; cursor: pointer;
 &:hover { background: var(--color-main-neutral-light); }
`;
export function InputButton({
  children,
  focused,
  onClick
}: {
  children: string;
  focused: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className="type-xsmall-body"
      $focused={focused}
      type="button"
      onClick={onClick}
      aria-pressed={focused}
    >
      <span>{children}</span>
    </Button>
  );
}
