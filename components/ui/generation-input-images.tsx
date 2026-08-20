"use client";

import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import type { GenerationInputImage } from "@/system/create/generation-library";

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
`;

const Item = styled.figure`
  display: flex;
  width: 216px;
  max-width: 100%;
  margin: 0;
  flex-direction: column;
  gap: var(--space-3xs);
`;

const Thumbnail = styled.div`
  position: relative;
  width: 216px;
  max-width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  background: var(--color-main-neutral);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

const Caption = styled.figcaption`
  overflow: hidden;
  color: var(--color-label-studio-comment);
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function GenerationInputImages({
  images,
}: {
  images: GenerationInputImage[];
}) {
  return (
    <List aria-label="생성 입력 이미지 목록">
      {images.map((image, index) => (
        <Item key={`${image.kind}-${index}`}>
          <Thumbnail>
            <LoadingImage
              src={image.imageUrl}
              alt={image.label}
              fill
              unoptimized
              sizes="216px"
            />
          </Thumbnail>
          <Caption title={image.label}>{image.label}</Caption>
        </Item>
      ))}
    </List>
  );
}
