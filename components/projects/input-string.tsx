"use client";

import styled from "styled-components";
import type { ComponentProps } from "react";

const Label = styled.label`
  display: flex;
  width: 514px;
  height: 23px;
  align-items: center;
  gap: var(--space-2xs);

  span {
    width: 103px;
    flex: 0 0 103px;
    text-align: right;
  }
`;

const Input = styled.input`
  height: 23px;
  min-width: 0;
  flex: 1;
  padding: 0 4px 2px;
  border: 0;
  border-bottom: 1px solid var(--color-label-studio-black);
  border-radius: 0;
  background: var(--color-main-neutral);
  outline: none;

  &:focus {
    border-bottom-width: 2px;
  }
`;
export function InputString({
  label,
  id,
  ...props
}: ComponentProps<"input"> & {
  label: string;
}) {
  return (
    <Label htmlFor={id}>
      <span className="type-xsmall-body">
        {label}
      </span>
      <Input
        className="type-xsmall-body"
        id={id}
        {...props}
      />
    </Label>
  );
}
