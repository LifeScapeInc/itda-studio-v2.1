"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { readImageFile } from "@/system/create/image-files";
import { UploadCard } from "./upload-card";

type ImageUploadCardProps = {
  image: string | null;
  emptyLabel: string;
  emptyDescription?: string;
  onChange: (image: string | null) => void;
  onPreviewClick?: () => void;
};

export function ImageUploadCard({
  image,
  emptyLabel,
  emptyDescription,
  onChange,
  onPreviewClick,
}: ImageUploadCardProps) {
  return (
    <UploadCard
      hasValue={Boolean(image)}
      icon={<ImagePlus size={34} strokeWidth={1.5} />}
      label={emptyLabel}
      description={emptyDescription}
      accept="image/*"
      removeLabel="이미지 제거"
      onFile={onPreviewClick ? undefined : async file => {
        onChange(await readImageFile(file));
      }}
      onRemove={() => onChange(null)}
      onPreviewClick={onPreviewClick}
    >
      {image ? (
        <Image
          src={image}
          alt="업로드 이미지"
          fill
          unoptimized
          sizes="(max-width: 1024px) 208px, 388px"
        />
      ) : undefined}
    </UploadCard>
  );
}
