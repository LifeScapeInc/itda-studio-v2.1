"use client";

import styled from "styled-components";
import { InputButton } from "./input-button";

const Row = styled.div`
  display: flex;
  width: 514px;
  height: 56px;
  align-items: center;
  gap: var(--space-md);
`;

const Label = styled.span`
  width: 104px;
  flex: 0 0 104px;
  text-align: right;
`;

const Choices = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

type InputChooseProps<T extends string> = {
  label: string;
  value: T | null;
  options: ReadonlyArray<{
    label: string;
    value: T;
  }>;
  onChange: (value: T) => void;
};

export function InputChoose<T extends string>({
  label,
  value,
  options,
  onChange,
}: InputChooseProps<T>) {
  return (
    <Row>
      <Label className="type-xsmall-body">{label}</Label>
      <Choices>
        {options.map((option) => (
          <InputButton
            focused={value === option.value}
            onClick={() => onChange(option.value)}
            key={option.value}
          >
            {option.label}
          </InputButton>
        ))}
      </Choices>
    </Row>
  );
}
