"use client";

import { ArrowUpRight, ImageIcon } from "lucide-react";
import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";

const Card = styled.button`
  display: flex;
  width: min(100%, 336px);
  aspect-ratio: 3 / 2;
  flex-direction: column;
  padding: var(--space-xs);
  border: 1px solid var(--color-border);
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

const Collage = styled.div`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 1.75fr 1fr;
  gap: var(--space-2xs);
`;

const Frame = styled.div`
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
    transition: transform 300ms ease;
  }

  ${Card}:hover & img {
    transform: scale(1.035);
  }
`;

const Side = styled.div`
  display: grid;
  min-height: 0;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--space-2xs);
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
`;

const Description = styled.span`
  overflow: hidden;
  color: var(--color-label-studio-comment);
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type ItemReferencesProps = {
  title: string;
  description: string;
  previewImages: string[];
  ariaLabel: string;
  onClick: () => void;
};

function PreviewFrame({
  src,
  sizes,
}: {
  src?: string;
  sizes: string;
}) {
  return (
    <Frame>
      {src ? (
        <LoadingImage src={src} alt="" fill sizes={sizes} />
      ) : (
        <ImageIcon size={24} strokeWidth={1.4} />
      )}
    </Frame>
  );
}

export function ItemReferences({
  title,
  description,
  previewImages,
  ariaLabel,
  onClick,
}: ItemReferencesProps) {
  return (
    <Card type="button" aria-label={ariaLabel} onClick={onClick}>
      <Collage>
        <PreviewFrame src={previewImages[0]} sizes="320px" />
        <Side>
          <PreviewFrame src={previewImages[1]} sizes="120px" />
          <PreviewFrame src={previewImages[2]} sizes="120px" />
        </Side>
      </Collage>
      <Label>
        <Copy>
          <span className="type-xsmall-body">{title}</span>
          <Description>{description}</Description>
        </Copy>
        <ArrowUpRight size={16} aria-hidden="true" />
      </Label>
    </Card>
  );
}
