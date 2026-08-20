"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styled from "styled-components";
import { ImageAlbum } from "@/components/references/image-album";

const Overlay = styled.div`
  position: absolute;
  z-index: 30;
  top: 56px;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  min-height: 0;
  padding: var(--space-sm);
  background: rgb(24 22 18 / 54%);
  backdrop-filter: blur(4px);
`;

const Viewer = styled.section`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
`;

const CloseButton = styled.button`
  position: absolute;
  z-index: 4;
  top: 0;
  right: 0;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: white;
  filter: drop-shadow(0 2px 5px rgb(0 0 0 / 58%));
  cursor: pointer;
  transition: opacity 150ms ease;

  &:hover {
    background: transparent;
    opacity: 0.72;
  }
`;

export function MoodboardDetailViewer({
  images,
  name,
  initialIndex,
  isOpen,
  onClose,
}: {
  images: string[];
  name: string;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const workspaceContent = typeof document === "undefined"
    ? null
    : document.querySelector("main");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  return isOpen && workspaceContent ? createPortal((
        <Overlay
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <Viewer
            role="dialog"
            aria-modal="true"
            aria-label={`${name} 상세 이미지`}
          >
            <CloseButton
              type="button"
              aria-label="상세보기 닫기"
              autoFocus
              onClick={onClose}
            >
              <X size={19} />
            </CloseButton>
            <ImageAlbum
              images={images}
              name={name}
              overlay
              selectedIndex={selectedIndex}
              onIndexChange={setSelectedIndex}
              emptyDescription="이 무드보드의 상세 이미지가 추가되면 여기에 표시됩니다."
            />
          </Viewer>
        </Overlay>
      ), workspaceContent) : null;
}
