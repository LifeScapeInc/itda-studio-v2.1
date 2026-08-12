"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import styled from "styled-components";
import { ButtonBack } from "@/components/ui/button-back";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";
import { HiddenScrollbar } from "@/system/styles/layout";

const Container = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--color-main-neutral-light);
`;

const Header = styled.header`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-lg);
`;

const Heading = styled.div`
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: var(--space-xs);

  span {
    color: var(--color-label-studio-comment);
    font-size: 12px;
  }
`;

const Album = styled.section`
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--color-main-neutral-light);
  overflow: hidden;
`;

const Viewport = styled.div`
  position: relative;
  min-height: 0;
  flex: 1;
  background: var(--color-main-neutral-light);
  overflow: hidden;
`;

const Track = styled.div<{ $index: number }>`
  display: flex;
  width: 100%;
  height: 100%;
  transform: translateX(${({ $index }) => -$index * 100}%);
  transition: transform 280ms ease;
`;

const Slide = styled.figure`
  position: relative;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  margin: 0;
  background: var(--color-main-neutral-light);

  img {
    object-fit: contain;
  }
`;

const DirectionButton = styled.button<{ $side: "left" | "right" }>`
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
  border-radius: 50%;
  background: rgb(255 255 255 / 90%);
  color: var(--color-label-studio-black);
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(32 29 23 / 10%);
  transform: translateY(-50%);
  transition:
    background 150ms ease,
    opacity 150ms ease;

  &:hover:not(:disabled) {
    background: var(--color-main-neutral-light);
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
`;

const Footer = styled.div`
  display: flex;
  height: 88px;
  flex: 0 0 88px;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-main-neutral-light);
`;

const Counter = styled.span`
  width: 54px;
  flex: 0 0 54px;
  color: var(--color-label-studio-comment);
  font-size: 12px;
  text-align: center;
`;

const Thumbnails = styled(HiddenScrollbar)`
  display: flex;
  min-width: 0;
  flex: 1;
  gap: var(--space-2xs);
  overflow-x: auto;
`;

const Thumbnail = styled.button<{ $active: boolean }>`
  position: relative;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  padding: 0;
  border: 2px solid ${({ $active }) => (
    $active ? "var(--color-main-primary)" : "transparent"
  )};
  border-radius: 8px;
  background: var(--color-main-neutral-light);
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

export function FurnitureViewer({
  category,
}: {
  category: FurnitureCategory;
}) {
  const [index, setIndex] = useState(0);
  const lastIndex = category.images.length - 1;

  const showPrevious = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const showNext = useCallback(() => {
    setIndex((current) => Math.min(lastIndex, current + 1));
  }, [lastIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

  return (
    <Container>
      <ButtonBack
        href="/furniture"
        label="가구 목록"
      />
      <Header>
        <Heading>
          <h1 className="type-xsmall-body">{category.name}</h1>
          <span>{category.images.length}장의 이미지</span>
        </Heading>
      </Header>

      {category.images.length ? (
        <Album aria-label={`${category.name} 이미지 앨범`}>
          <Viewport>
            <Track $index={index}>
              {category.images.map((src, imageIndex) => (
                <Slide key={src} aria-hidden={imageIndex !== index}>
                  <Image
                    src={src}
                    alt={`${category.name} 레퍼런스 ${imageIndex + 1}`}
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
              aria-label="이전 이미지"
              disabled={index === 0}
              onClick={showPrevious}
            >
              <ChevronLeft size={22} />
            </DirectionButton>
            <DirectionButton
              type="button"
              $side="right"
              aria-label="다음 이미지"
              disabled={index === lastIndex}
              onClick={showNext}
            >
              <ChevronRight size={22} />
            </DirectionButton>
          </Viewport>
          <Footer>
            <Counter>{index + 1} / {category.images.length}</Counter>
            <Thumbnails aria-label="이미지 미리보기 목록">
              {category.images.map((src, imageIndex) => (
                <Thumbnail
                  type="button"
                  $active={imageIndex === index}
                  aria-label={`${imageIndex + 1}번 이미지 보기`}
                  aria-pressed={imageIndex === index}
                  onClick={() => setIndex(imageIndex)}
                  key={src}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                  />
                </Thumbnail>
              ))}
            </Thumbnails>
          </Footer>
        </Album>
      ) : (
        <Empty>
          <Images size={40} strokeWidth={1.3} />
          <strong>등록된 이미지가 없습니다.</strong>
          <span className="type-xsmall-thin">
            이 가구 종류의 레퍼런스가 추가되면 여기에 표시됩니다.
          </span>
        </Empty>
      )}
    </Container>
  );
}
