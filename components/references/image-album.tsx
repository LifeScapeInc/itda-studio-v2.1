"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import { HiddenScrollbar } from "@/system/styles/layout";

const Album = styled.section<{ $overlay: boolean }>`
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "var(--color-main-neutral-light)"
  )};
  overflow: hidden;
`;

const Viewport = styled.div<{ $overlay: boolean }>`
  position: relative;
  min-height: 0;
  flex: 1;
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "var(--color-main-neutral-light)"
  )};
  overflow: hidden;
`;

const Track = styled.div<{ $index: number }>`
  display: flex;
  width: 100%;
  height: 100%;
  transform: translateX(${({ $index }) => -$index * 100}%);
  transition: transform 280ms ease;
`;

const Slide = styled.figure<{ $overlay: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  margin: 0;
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "var(--color-main-neutral-light)"
  )};

  img {
    object-fit: contain;
  }
`;

const DirectionButton = styled.button<{
  $side: "left" | "right";
  $overlay: boolean;
}>`
  position: absolute;
  z-index: 2;
  top: 50%;
  ${({ $side }) => ($side === "left" ? "left: 20px;" : "right: 20px;")}
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: ${({ $overlay }) => ($overlay ? "0" : "50%")};
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "rgb(255 255 255 / 90%)"
  )};
  color: ${({ $overlay }) => (
    $overlay ? "white" : "var(--color-label-studio-black)"
  )};
  cursor: pointer;
  filter: ${({ $overlay }) => (
    $overlay ? "drop-shadow(0 2px 5px rgb(0 0 0 / 58%))" : "none"
  )};
  box-shadow: ${({ $overlay }) => (
    $overlay ? "none" : "0 6px 18px rgb(32 29 23 / 10%)"
  )};
  transform: translateY(-50%);
  transition:
    background 150ms ease,
    opacity 150ms ease;

  &:hover:not(:disabled) {
    background: ${({ $overlay }) => (
      $overlay ? "transparent" : "var(--color-main-neutral-light)"
    )};
    opacity: ${({ $overlay }) => ($overlay ? "0.72" : "1")};
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
`;

const Footer = styled.div<{ $overlay: boolean }>`
  position: relative;
  display: flex;
  height: 88px;
  flex: 0 0 88px;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "var(--color-main-neutral-light)"
  )};
`;

const Counter = styled.span<{ $overlay: boolean }>`
  ${({ $overlay }) => $overlay && `
    position: absolute;
    z-index: 1;
    left: 0;
  `}
  width: 54px;
  flex: 0 0 54px;
  color: ${({ $overlay }) => (
    $overlay ? "rgb(255 255 255 / 82%)" : "var(--color-label-studio-comment)"
  )};
  font-size: 12px;
  text-align: center;
`;

const Thumbnails = styled(HiddenScrollbar)<{ $overlay: boolean }>`
  display: flex;
  min-width: 0;
  flex: 1;
  justify-content: ${({ $overlay }) => (
    $overlay ? "safe center" : "flex-start"
  )};
  gap: var(--space-2xs);
  overflow-x: auto;
`;

const Thumbnail = styled.button<{ $active: boolean; $overlay: boolean }>`
  position: relative;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  padding: 0;
  border: 2px solid ${({ $active }) => (
    $active ? "var(--color-main-primary)" : "transparent"
  )};
  border-radius: 8px;
  background: ${({ $overlay }) => (
    $overlay ? "transparent" : "var(--color-main-neutral-light)"
  )};
  overflow: hidden;
  cursor: pointer;

  img {
    object-fit: cover;
  }
`;

const Empty = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);
`;

export function ImageAlbum({
  images,
  name,
  emptyDescription,
  overlay = false,
  selectedIndex,
  onIndexChange,
  showFooter = true,
}: {
  images: string[];
  name: string;
  emptyDescription?: string;
  overlay?: boolean;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
  showFooter?: boolean;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const index = selectedIndex ?? internalIndex;
  const lastIndex = images.length - 1;

  const setIndex = useCallback((nextIndex: number) => {
    setInternalIndex(nextIndex);
    onIndexChange?.(nextIndex);
  }, [onIndexChange]);

  const showPrevious = useCallback(() => {
    setIndex(Math.max(0, index - 1));
  }, [index, setIndex]);

  const showNext = useCallback(() => {
    setIndex(Math.min(lastIndex, index + 1));
  }, [index, lastIndex, setIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.defaultPrevented
        || target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNext, showPrevious]);

  if (!images.length) {
    return (
      <Empty>
        <Images size={40} strokeWidth={1.3} />
        <strong>등록된 이미지가 없습니다.</strong>
        <span className="type-xsmall-thin">
          {emptyDescription ?? "이미지가 추가되면 여기에 표시됩니다."}
        </span>
      </Empty>
    );
  }

  return (
    <Album $overlay={overlay} aria-label={`${name} 이미지 앨범`}>
      <Viewport $overlay={overlay}>
        <Track $index={index}>
          {images.map((src, imageIndex) => (
            <Slide
              key={src}
              $overlay={overlay}
              aria-hidden={imageIndex !== index}
            >
              <LoadingImage
                src={src}
                alt={`${name} 레퍼런스 ${imageIndex + 1}`}
                fill
                unoptimized
                priority={imageIndex === 0}
                sizes="calc(100vw - 275px)"
              />
            </Slide>
          ))}
        </Track>
        <DirectionButton
          type="button"
          $side="left"
          $overlay={overlay}
          aria-label="이전 이미지"
          disabled={index === 0}
          onClick={showPrevious}
        >
          <ChevronLeft size={22} />
        </DirectionButton>
        <DirectionButton
          type="button"
          $side="right"
          $overlay={overlay}
          aria-label="다음 이미지"
          disabled={index === lastIndex}
          onClick={showNext}
        >
          <ChevronRight size={22} />
        </DirectionButton>
      </Viewport>
      {showFooter ? <Footer $overlay={overlay}>
        <Counter $overlay={overlay}>{index + 1} / {images.length}</Counter>
        <Thumbnails
          $overlay={overlay}
          aria-label="이미지 미리보기 목록"
        >
          {images.map((src, imageIndex) => (
            <Thumbnail
              type="button"
              $active={imageIndex === index}
              $overlay={overlay}
              aria-label={`${imageIndex + 1}번 이미지 보기`}
              aria-pressed={imageIndex === index}
              onClick={() => setIndex(imageIndex)}
              key={src}
            >
              <LoadingImage
                src={src}
                alt=""
                fill
                unoptimized
                sizes="64px"
              />
            </Thumbnail>
          ))}
        </Thumbnails>
      </Footer> : null}
    </Album>
  );
}
