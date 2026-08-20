"use client";

import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import type { MoodboardLayoutItem } from "@/system/moodboard/moodboard-layout";

const Tile = styled.button<{ $item: MoodboardLayoutItem }>`
  position: absolute;
  z-index: ${({ $item }) => Math.round($item.weight * 10)};
  top: ${({ $item }) => `${$item.rect.y * 100}%`};
  left: ${({ $item }) => `${$item.rect.x * 100}%`};
  width: ${({ $item }) => `${$item.rect.width * 100}%`};
  height: ${({ $item }) => `${$item.rect.height * 100}%`};
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--color-main-neutral);
  overflow: hidden;
  cursor: zoom-in;

  img {
    object-fit: cover;
    transform: scale(1);
    transition: transform 280ms ease-out;
  }

  &:hover img {
    transform: scale(1.04);
  }

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      transition: none;
    }
  }
`;

export function MoodboardCollageItem({
  item,
  styleName,
  imageIndex,
  onSelect,
}: {
  item: MoodboardLayoutItem;
  styleName: string;
  imageIndex: number;
  onSelect: (imageIndex: number) => void;
}) {
  return (
    <Tile
      type="button"
      $item={item}
      aria-label={`${styleName} 이미지 ${imageIndex + 1} 상세보기`}
      title="이미지 상세보기"
      onClick={() => onSelect(imageIndex)}
    >
      <LoadingImage
        src={item.src}
        alt={`${styleName} 무드보드 이미지 ${imageIndex + 1}`}
        fill
        priority={imageIndex < 3}
        sizes={`${Math.max(12, Math.round(item.rect.width * 100))}vw`}
      />
    </Tile>
  );
}
