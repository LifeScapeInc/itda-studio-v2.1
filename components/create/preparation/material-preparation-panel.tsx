"use client";

import { useRef, useState } from "react";
import { Database, Upload } from "lucide-react";
import styled from "styled-components";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { useCreateStore } from "@/stores/useCreateStore";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import {
  MATERIAL_PANEL_MAX_WIDTH,
  MATERIAL_PANEL_MIN_WIDTH,
} from "@/system/layout/workspace-layout";
import { readImageFile } from "@/system/create/image-files";
import type { ReferenceLibraryData } from "@/system/create/reference-library";
import { ImageUploadCard } from "./image-upload-card";
import { ReferenceLibraryModal } from "./reference-library-modal";

const Panel = styled.aside`
  position: relative;
  display: flex;
  min-width: ${MATERIAL_PANEL_MIN_WIDTH}px;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MaterialSection = styled.section`
  display: flex;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--space-2xs);
  padding-bottom: var(--space-sm);
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-surface);
`;

const SectionTitle = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2xs);
`;

const Step = styled.span`
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-main-primary);
  color: var(--color-surface);
  font-size: 11px;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  gap: var(--space-2xs);
`;

const ActionButton = styled.button`
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  font-size: 11px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease;

  &:hover {
    border-color: var(--color-main-primary);
    background: color-mix(
      in srgb,
      var(--color-main-primary) 5%,
      var(--color-surface)
    );
  }
`;

export function MaterialPreparationPanel({
  library,
}: {
  library: ReferenceLibraryData;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const referenceInput = useRef<HTMLInputElement>(null);
  const productImage = useCreateStore((state) => state.productImage);
  const referenceImage = useCreateStore((state) => state.referenceImage);
  const setProductImage = useCreateStore((state) => state.setProductImage);
  const setReferenceImage = useCreateStore((state) => state.setReferenceImage);
  const materialPanelWidth = useWorkspaceLayoutStore(
    (state) => state.materialPanelWidth,
  );
  const resizeMaterialPanel = useWorkspaceLayoutStore(
    (state) => state.resizeMaterialPanel,
  );

  return (
    <Panel>
      <PanelResizeHandle
        edge="right"
        label="재료 준비 너비 조절"
        value={materialPanelWidth}
        minimum={MATERIAL_PANEL_MIN_WIDTH}
        maximum={MATERIAL_PANEL_MAX_WIDTH}
        onResize={resizeMaterialPanel}
      />
      <Header>
        <h1 className="type-xsmall-body">재료 준비</h1>
      </Header>
      <Body>
        <MaterialSection>
          <SectionTitle>
            <Step>1</Step>
            <span className="type-small-head">내 제품</span>
          </SectionTitle>
          <ImageUploadCard
            image={productImage}
            emptyLabel="가구 이미지 업로드"
            onChange={setProductImage}
          />
        </MaterialSection>

        <MaterialSection>
          <SectionTitle>
            <Step>2</Step>
            <span className="type-small-head">레퍼런스</span>
          </SectionTitle>
          <ImageUploadCard
            image={referenceImage}
            emptyLabel="레퍼런스 DB 열기"
            onChange={setReferenceImage}
            onPreviewClick={() => setLibraryOpen(true)}
          />
          <Actions>
            <ActionButton
              type="button"
              onClick={() => setLibraryOpen(true)}
            >
              <Database size={13} />
              DB 열기
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => referenceInput.current?.click()}
            >
              <Upload size={13} />
              PC에서 업로드
            </ActionButton>
            <input
              ref={referenceInput}
              hidden
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setReferenceImage(await readImageFile(file));
                }
                event.target.value = "";
              }}
            />
          </Actions>
        </MaterialSection>
      </Body>
      {libraryOpen ? (
        <ReferenceLibraryModal
          library={library}
          onClose={() => setLibraryOpen(false)}
          onSelect={setReferenceImage}
        />
      ) : null}
    </Panel>
  );
}
