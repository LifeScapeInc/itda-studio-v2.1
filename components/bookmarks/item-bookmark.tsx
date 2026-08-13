"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import styled from "styled-components";
import type { LibraryGenerationShot } from "@/system/create/generation-library";

const Card = styled.button<{ $active: boolean }>`
  display: flex;
  width: min(100%, 336px);
  aspect-ratio: 3 / 2;
  flex-direction: column;
  padding: var(--space-xs);
  border: 1px solid ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 12px;
  background: var(--color-surface);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &:hover {
    border-color: var(--color-main-primary);
    box-shadow: 0 10px 26px rgb(32 29 23 / 10%);
    transform: translateY(-3px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 3px;
  }
`;

const Thumbnail = styled.div`
  position: relative;
  min-height: 0;
  flex: 1;
  border-radius: 8px;
  background: var(--color-main-neutral);
  overflow: hidden;

  img {
    object-fit: cover;
    transition: transform 300ms ease;
  }

  ${Card}:hover & img {
    transform: scale(1.035);
  }
`;

const Label = styled.div`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-3xs) 0;
`;

const Copy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  & > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Description = styled.span`
  overflow: hidden;
  color: var(--color-label-studio-comment);
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function ItemBookmark({
  shot,
  active,
  onClick,
}: {
  shot: LibraryGenerationShot;
  active: boolean;
  onClick: () => void;
}) {
  const generatedAt = new Date(shot.metadata.generatedAt).toLocaleString(
    "ko-KR",
  );

  return (
    <Card
      type="button"
      $active={active}
      aria-label={`${generatedAt} 생성 북마크 보기`}
      aria-pressed={active}
      onClick={onClick}
    >
      <Thumbnail>
        <Image
          src={shot.imageUrl!}
          alt={`${shot.metadata.variationType} 북마크`}
          fill
          unoptimized
          sizes="336px"
        />
      </Thumbnail>
      <Label>
        <Copy>
          <span className="type-xsmall-body">{generatedAt}</span>
          <Description>{shot.metadata.variationType}</Description>
        </Copy>
        <ArrowUpRight size={16} aria-hidden="true" />
      </Label>
    </Card>
  );
}
