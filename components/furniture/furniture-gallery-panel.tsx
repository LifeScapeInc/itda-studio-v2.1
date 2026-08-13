"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import {
  FURNITURE_GALLERY_PANEL_MAX_WIDTH,
  FURNITURE_GALLERY_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";
import { HiddenScrollbar } from "@/system/styles/layout";

const Panel = styled.aside<{ $width: number }>`
  position: relative;
  display: flex;
  width: ${({ $width }) => $width}px;
  min-width: ${FURNITURE_GALLERY_PANEL_MIN_WIDTH}px;
  min-height: 0;
  flex: 0 0 ${({ $width }) => $width}px;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Header = styled.div`
  display: flex;
  flex: 0 0 auto;
  padding: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
`;

const SearchField = styled.label`
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);

  &:focus-within {
    border-color: var(--color-main-primary);
  }
`;

const SearchInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-label-studio-black);

  &::placeholder {
    color: var(--color-label-studio-comment);
  }
`;

const Scroll = styled(HiddenScrollbar)`
  min-height: 0;
  flex: 1;
  padding: var(--space-sm);
  overflow-y: auto;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  align-content: start;
  gap: var(--space-2xs);
`;

const GalleryItem = styled.button<{ $selected: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "transparent"
  )};
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    transform 150ms ease;

  img {
    object-fit: cover;
  }

  &:hover {
    border-color: var(--color-main-primary);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 2px;
  }
`;

export function FurnitureGalleryPanel({
  images,
  name,
  selectedIndex,
  onSelect,
}: {
  images: string[];
  name: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const width = useWorkspaceLayoutStore(
    (state) => state.furnitureGalleryPanelWidth,
  );
  const resize = useWorkspaceLayoutStore(
    (state) => state.resizeFurnitureGalleryPanel,
  );

  return (
    <Panel $width={width} aria-label={`${name} 이미지 갤러리`}>
      <PanelResizeHandle
        edge="left"
        label="가구 이미지 갤러리 너비 조절"
        value={width}
        minimum={FURNITURE_GALLERY_PANEL_MIN_WIDTH}
        maximum={FURNITURE_GALLERY_PANEL_MAX_WIDTH}
        onResize={resize}
      />
      <Header>
        <SearchField>
          <Search size={16} aria-hidden="true" />
          <SearchInput
            type="search"
            aria-label="가구 이미지 검색"
            placeholder="이미지 검색"
          />
        </SearchField>
      </Header>
      <Scroll>
        <Grid>
          {images.map((src, index) => (
            <GalleryItem
              type="button"
              $selected={selectedIndex === index}
              aria-label={`${index + 1}번 이미지 보기`}
              aria-pressed={selectedIndex === index}
              onClick={() => onSelect(index)}
              key={src}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                sizes="120px"
              />
            </GalleryItem>
          ))}
        </Grid>
      </Scroll>
    </Panel>
  );
}
