"use client";

import styled from "styled-components";
import { InputButton } from "./input-button";

const Row = styled.div`
display: flex; width: 100%; align-items: center; gap: 16px;
`;

const Label = styled.span`
width: 104px; flex: 0 0 104px; text-align: left; font-size: 13px; font-weight: 500;
`;

const Choices = styled.div`
display: flex; min-width: 0; flex: 1; flex-wrap: wrap; align-items: center; gap: 8px;
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
