"use client";

import { ImageIcon, Maximize2 } from "lucide-react";
import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";

const Empty = styled.div`
  display: flex;
  width: min(100%, 960px);
  margin: auto;
  padding: var(--space-lg);
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
  text-align: center;
`;

const Materials = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  align-items: start;
  gap: var(--space-sm);
`;

const Material = styled.figure`
  min-width: 0;
  margin: 0;
  text-align: left;

  figcaption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  small { font-size: 11px; font-weight: 400; }
`;

const MaterialPreview = styled.button`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);
  overflow: hidden;
  cursor: zoom-in;

  &:disabled { cursor: default; }
  &:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 3px; }

  > span:last-child {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    background: var(--color-surface);
  }

  img {
    object-fit: contain;
  }
`;

export function StagingEmptyState({
  productImage,
  referenceImage,
  onOpenImage,
}: {
  productImage: string | null;
  referenceImage: string | null;
  onOpenImage?: (imageUrl: string, label: string) => void;
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
        <Material>
        <MaterialPreview
          type="button"
          disabled={!productImage}
          aria-label="내 제품 이미지 크게 보기"
          onClick={() => {
            if (productImage) onOpenImage?.(productImage, "내 제품");
          }}
        >
          {productImage ? (
            <LoadingImage
              src={productImage}
              alt="내 제품"
              fill
              unoptimized
              sizes="(max-width: 1400px) 420px, 460px"
            />
          ) : (
            <ImageIcon />
          )}
          {productImage ? <span aria-hidden="true"><Maximize2 size={14} /></span> : null}
        </MaterialPreview>
        <figcaption>내 제품 <small>{productImage ? "클릭하여 확대" : "제품을 등록해 주세요"}</small></figcaption>
        </Material>
        <Material>
        <MaterialPreview
          type="button"
          disabled={!referenceImage}
          aria-label="레퍼런스 이미지 크게 보기"
          onClick={() => {
            if (referenceImage) onOpenImage?.(referenceImage, "레퍼런스");
          }}
        >
          {referenceImage ? (
            <LoadingImage
              src={referenceImage}
              alt="레퍼런스"
              fill
              unoptimized
              sizes="(max-width: 1400px) 420px, 460px"
            />
          ) : (
            <ImageIcon />
          )}
          {referenceImage ? <span aria-hidden="true"><Maximize2 size={14} /></span> : null}
        </MaterialPreview>
        <figcaption>레퍼런스 <small>{referenceImage ? "클릭하여 확대" : "선택 사항"}</small></figcaption>
        </Material>
      </Materials>
      <p className="type-xsmall-thin">
        우측에서 이미지 비율과 생성 옵션을 설정해 주세요.
      </p>
    </Empty>
  );
}
