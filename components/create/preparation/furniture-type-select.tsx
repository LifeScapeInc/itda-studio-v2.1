"use client";

import { ChevronDown } from "lucide-react";
import styled from "styled-components";
import {
  FURNITURE_TYPE_OPTIONS,
  type FurnitureType,
} from "@/system/create/generation-options";

const Field = styled.div`
  position: relative;
  width: 100%;
`;

const Select = styled.select<{ $hasValue: boolean }>`
  width: 100%;
  height: 40px;
  appearance: none;
  padding: 0 calc(var(--space-xl) + var(--space-3xs)) 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  outline: none;
  background: var(--color-surface);
  color: ${({ $hasValue }) => (
    $hasValue
      ? "var(--color-label-studio-black)"
      : "var(--color-label-studio-comment)"
  )};
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;

  &:hover {
    border-color: color-mix(
      in srgb,
      var(--color-main-primary) 55%,
      var(--color-border)
    );
    background: color-mix(
      in srgb,
      var(--color-main-primary) 4%,
      var(--color-surface)
    );
  }

  &:focus-visible {
    border-color: var(--color-main-primary);
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 14%,
      transparent
    );
  }
`;

const Arrow = styled(ChevronDown)`
  position: absolute;
  top: 50%;
  right: var(--space-xs);
  color: var(--color-label-studio-comment);
  pointer-events: none;
  transform: translateY(-50%);
`;

type FurnitureTypeSelectProps = {
  value: FurnitureType | null;
  onChange: (value: FurnitureType | null) => void;
};

export function FurnitureTypeSelect({
  value,
  onChange,
}: FurnitureTypeSelectProps) {
  return (
    <Field>
      <Select
        aria-label="가구 종류"
        value={value ?? ""}
        $hasValue={Boolean(value)}
        onChange={(event) => {
          onChange((event.target.value || null) as FurnitureType | null);
        }}
      >
        <option value="" disabled>
          가구 종류를 선택하세요
        </option>
        {FURNITURE_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Arrow size={16} aria-hidden />
    </Field>
  );
}
