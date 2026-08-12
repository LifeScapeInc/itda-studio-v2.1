"use client";

import Image from "next/image";
import { Images } from "lucide-react";
import styled from "styled-components";
import type { ReferenceLibraryGroup } from "@/system/create/reference-library";

const Card = styled.button`
  display: flex;
  min-width: 0;
  aspect-ratio: 3 / 2;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
    box-shadow: 0 8px 22px rgb(32 29 23 / 10%);
    transform: translateY(-2px);
  }
`;

const Preview = styled.span`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 1.65fr 1fr;
  gap: var(--space-3xs);
`;

const Frame = styled.span`
  position: relative;
  display: grid;
  min-height: 0;
  place-items: center;
  border-radius: 8px;
  background: var(--color-main-neutral);
  color: var(--color-label-studio-comment);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

const Side = styled.span`
  display: grid;
  min-height: 0;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--space-3xs);
`;

const Label = styled.span`
  display: flex;
  min-width: 0;
  height: 42px;
  flex: 0 0 42px;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-3xs);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    color: var(--color-label-studio-comment);
    font-size: 10px;
  }
`;

function FrameImage({ src }: { src?: string }) {
  return (
    <Frame>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes="240px"
        />
      ) : (
        <Images size={22} strokeWidth={1.4} />
      )}
    </Frame>
  );
}

export function ReferenceLibraryCategoryItem({
  group,
  onClick,
}: {
  group: ReferenceLibraryGroup;
  onClick: () => void;
}) {
  return (
    <Card
      type="button"
      aria-label={`${group.name} 이미지 보기`}
      onClick={onClick}
    >
      <Preview>
        <FrameImage src={group.previewImages[0]} />
        <Side>
          <FrameImage src={group.previewImages[1]} />
          <FrameImage src={group.previewImages[2]} />
        </Side>
      </Preview>
      <Label>
        <span className="type-xsmall-body">{group.name}</span>
        <span>{group.description}</span>
      </Label>
    </Card>
  );
}
