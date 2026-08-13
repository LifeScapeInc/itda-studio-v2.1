"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import styled from "styled-components";

const Empty = styled.div`
  display: flex;
  width: min(100%, 640px);
  margin: auto;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
  text-align: center;
`;

const Materials = styled.div`
  display: flex;
  width: min(100%, 488px);
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
`;

const MaterialPreview = styled.span`
  position: relative;
  display: grid;
  width: 224px;
  max-width: calc((100% - 24px) / 2);
  aspect-ratio: 1;
  flex: 0 1 224px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

export function StagingEmptyState({
  productImage,
  referenceImage,
}: {
  productImage: string | null;
  referenceImage: string | null;
}) {
  if (!productImage && !referenceImage) {
    return (
      <Empty>
        <ImageIcon size={42} strokeWidth={1.3} />
        <strong>생성할 재료를 준비해 주세요.</strong>
        <p className="type-xsmall-thin">
          내 제품 이미지를 등록하면 미리보기가 표시됩니다.
        </p>
      </Empty>
    );
  }

  return (
    <Empty>
      <Materials>
        <MaterialPreview>
          {productImage ? (
            <Image
              src={productImage}
              alt="내 제품"
              fill
              unoptimized
              sizes="224px"
            />
          ) : (
            <ImageIcon />
          )}
        </MaterialPreview>
        <span>+</span>
        <MaterialPreview>
          {referenceImage ? (
            <Image
              src={referenceImage}
              alt="레퍼런스"
              fill
              unoptimized
              sizes="224px"
            />
          ) : (
            <ImageIcon />
          )}
        </MaterialPreview>
      </Materials>
      <p className="type-xsmall-thin">
        우측에서 콘텐츠 세트 또는 앵글 변주를 선택하세요.
      </p>
    </Empty>
  );
}
