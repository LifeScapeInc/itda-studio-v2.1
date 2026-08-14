"use client";

import { useEffect } from "react";
import styled from "styled-components";

const Backdrop = styled.div`
  position: fixed;
  z-index: 120;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-lg);
  background: rgb(18 17 14 / 86%);
`;

const ViewerImage = styled.img`
  display: block;
  width: auto;
  max-width: calc(100vw - var(--space-lg) - var(--space-lg));
  height: auto;
  max-height: calc(100vh - var(--space-lg) - var(--space-lg));
  object-fit: contain;
  cursor: default;
`;

export function GeneratedImageLightbox({
  imageUrl,
  alt,
  onClose,
}: {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Backdrop
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 원본 보기`}
      onMouseDown={onClose}
    >
      <ViewerImage
        src={imageUrl}
        alt={alt}
        onMouseDown={(event) => event.stopPropagation()}
      />
    </Backdrop>
  );
}
