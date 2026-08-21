"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import styled from "styled-components";

const Option = styled.button<{ $selected: boolean; $hasPreview: boolean }>`
  display: grid;
  width: 100%;
  height: 66px;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2xs);
  padding: ${({ $hasPreview }) => (
    $hasPreview ? "0 0 0 var(--space-xs)" : "var(--space-xs)"
  )};
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 8px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-neutral)" : "var(--color-surface)"
  )};
  color: var(--color-label-studio-black);
  overflow: hidden;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
  }
`;

const CheckBox = styled.span<{ $selected: boolean }>`
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 5px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "transparent"
  )};
  color: var(--color-surface);
`;

const Copy = styled.span<{ $hasPreview: boolean }>`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);
  overflow: hidden;
  padding: ${({ $hasPreview }) => (
    $hasPreview ? "var(--space-xs) 0" : "0"
  )};

`;

const Description = styled.small`
  display: block;
  overflow: hidden;
  color: var(--color-label-studio-comment);
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Title = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--space-3xs);

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > svg {
    flex: 0 0 auto;
  }
`;

const Preview = styled.span<{ $selected: boolean }>`
  position: relative;
  width: 104px;
  height: 100%;
  min-height: 66px;
  align-self: stretch;
  overflow: hidden;

  img {
    object-fit: cover;
  }

  &::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      ${({ $selected }) => (
        $selected ? "var(--color-main-neutral)" : "var(--color-surface)"
      )} 0%,
      transparent 38%
    );
    content: "";
  }
`;

export function GenerationOptionCard({
  selected,
  label,
  description,
  icon,
  trailing,
  previewImage,
  role,
  ariaChecked,
  ariaPressed,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  previewImage?: string;
  role?: "radio";
  ariaChecked?: boolean;
  ariaPressed?: boolean;
  onClick: () => void;
}) {
  return (
    <Option
      type="button"
      role={role}
      aria-checked={ariaChecked}
      aria-pressed={ariaPressed}
      $selected={selected}
      $hasPreview={Boolean(previewImage)}
      onClick={onClick}
    >
      <CheckBox $selected={selected}>
        {selected ? <Check size={12} /> : null}
      </CheckBox>
      <Copy $hasPreview={Boolean(previewImage)}>
        <Title>
          {icon}
          <span>{label}</span>
        </Title>
        <Description>{description}</Description>
      </Copy>
      {previewImage ? (
        <Preview $selected={selected} aria-hidden="true">
          <Image src={previewImage} alt="" fill sizes="104px" />
        </Preview>
      ) : trailing}
    </Option>
  );
}
