"use client";

import { useRef, useState } from "react";
import { Database, Upload } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { readImageFile } from "@/system/create/image-files";
import type { ReferenceLibraryData } from "@/system/create/reference-library";
import { ImageUploadCard } from "./image-upload-card";
import {
  MaterialPreparationLayout,
  MaterialPreparationSection,
} from "./material-preparation-layout";
import { ReferenceLibraryModal } from "./reference-library-modal";

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
  return (
    <MaterialPreparationLayout title="재료 준비">
        <MaterialPreparationSection index={1} title="내 제품">
          <ImageUploadCard
            image={productImage}
            emptyLabel="가구 이미지 업로드"
            onChange={setProductImage}
          />
        </MaterialPreparationSection>

        <MaterialPreparationSection index={2} title="레퍼런스">
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
        </MaterialPreparationSection>
      {libraryOpen ? (
        <ReferenceLibraryModal
          library={library}
          selectedImage={referenceImage}
          onClose={() => setLibraryOpen(false)}
          onSelect={setReferenceImage}
        />
      ) : null}
    </MaterialPreparationLayout>
  );
}
