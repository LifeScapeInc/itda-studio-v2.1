"use client";

import styled from "styled-components";
const Button = styled.button<{
  $focused: boolean;
}>`
  position: relative;
  display: grid;
  width: 187px;
  height: 56px;
  place-items: center;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: ${({ $focused }) => (
    $focused ? "var(--color-surface)" : "var(--color-label-studio-black)"
  )};
  cursor: pointer;

  &::before {
    position: absolute;
    z-index: 0;
    inset: 5px 0;
    border: 1px solid var(--color-label-studio-black);
    border-radius: 3px;
    background: ${({ $focused }) => (
      $focused ? "var(--color-main-primary)" : "var(--color-main-neutral)"
    )};
    content: "";
  }

  span {
    position: relative;
    z-index: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 2px;
  }
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
