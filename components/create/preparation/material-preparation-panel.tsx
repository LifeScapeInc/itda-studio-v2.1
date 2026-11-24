"use client";

import { memo, useRef, useState } from "react";
import { Database, Upload } from "lucide-react";
import { useCreateStore } from "@/stores/useCreateStore";
import { readImageFile } from "@/system/create/image-files";
import type { ReferenceLibraryData } from "@/system/create/reference-library";
import { BrandAssignment } from "./brand-assignment";
import { ImageUploadCard } from "./image-upload-card";
import {
  MaterialPreparationLayout,
  MaterialPreparationSection,
} from "./material-preparation-layout";
import { ReferenceLibraryModal } from "./reference-library-modal";
import { TooltipIconAction } from "@/components/ui/tooltip-icon-action";

export const MaterialPreparationPanel = memo(function MaterialPreparationPanel({
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
    <MaterialPreparationLayout title="재료 탐색기">
        <MaterialPreparationSection index={1} title="내 제품">
          <ImageUploadCard
            image={productImage}
            emptyLabel="가구 이미지 업로드"
            onChange={setProductImage}
          />
        </MaterialPreparationSection>

        <MaterialPreparationSection index={2} title="레퍼런스" actions={<>
          <TooltipIconAction type="button" caption="레퍼런스 DB 열기" onClick={() => setLibraryOpen(true)}><Database size={14} /></TooltipIconAction>
          <TooltipIconAction type="button" caption="PC에서 업로드" onClick={() => referenceInput.current?.click()}><Upload size={14} /></TooltipIconAction>
        </>}>
          <ImageUploadCard
            image={referenceImage}
            emptyLabel="레퍼런스 DB 열기"
            onChange={setReferenceImage}
            onPreviewClick={() => setLibraryOpen(true)}
          />

        </MaterialPreparationSection>
        <BrandAssignment />
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
});
