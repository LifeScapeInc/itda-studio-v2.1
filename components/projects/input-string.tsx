"use client";

import styled from "styled-components";
import type { ComponentProps } from "react";

const Label = styled.label`
display: flex; width: 100%; align-items: center; gap: 16px;
 span { width: 104px; flex: 0 0 104px; text-align: left; font-size: 13px; font-weight: 500; }
`;

const Input = styled.input`
height: 32px; min-width: 0; flex: 1; padding: 0 8px; border: 1px solid var(--color-border); border-radius: 4px;
 background: var(--color-surface); color: var(--color-label-studio-black); outline: none; font-size: 13px; font-weight: 400;
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
