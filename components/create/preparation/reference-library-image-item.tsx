"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import styled from "styled-components";

const Item = styled.button`
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    transform 200ms ease;

  img {
    object-fit: cover;
    transition: transform 260ms ease;
  }

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
    box-shadow: 0 8px 22px rgb(32 29 23 / 13%);
    transform: translateY(-2px);
  }

  &:hover img,
  &:focus-visible img {
    transform: scale(1.025);
  }
`;

const Shade = styled.span`
  position: absolute;
  inset: 0;
  background: rgb(32 29 23 / 0%);
  transition: background 200ms ease;

  ${Item}:hover &,
  ${Item}:focus-visible & {
    background: rgb(32 29 23 / 12%);
  }
`;

const SelectLabel = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: 999px;
  background: rgb(32 29 23 / 82%);
  color: var(--color-surface);
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transform: translate(-50%, calc(-50% + 4px));
  transition:
    opacity 200ms ease,
    transform 200ms ease;

  ${Item}:hover &,
  ${Item}:focus-visible & {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`;

export function ReferenceLibraryImageItem({
  src,
  index,
  onSelect,
}: {
  src: string;
  index: number;
  onSelect: () => void;
}) {
  return (
    <Item
      type="button"
      aria-label={`${index + 1}번 레퍼런스 선택`}
      onClick={onSelect}
    >
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes="220px"
      />
      <Shade aria-hidden="true" />
      <SelectLabel aria-hidden="true">
        <CheckCircle2 size={15} />
        선택하기
      </SelectLabel>
    </Item>
  );
}
