"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { getCutCount } from "@/system/create/generation-options";
import { GenerationProgressGrid } from "./generation-progress-grid";

const Canvas = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-main-neutral-light);
`;

const Header = styled.header`
  display: flex;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);

  p {
    color: var(--color-label-studio-comment);
  }
`;

const Stage = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xs);
`;

const ImageStage = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  overflow: hidden;

  img {
    object-fit: contain;
  }
`;

const Empty = styled.div`
  display: flex;
  width: min(100%, 640px);
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
  border-radius: 12px;
  background: var(--color-main-neutral-light);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

export function StagingCanvas() {
  const productImage = useCreateStore((state) => state.productImage);
  const referenceImage = useCreateStore((state) => state.referenceImage);
  const contentSet = useCreateStore((state) => state.contentSet);
  const freeCount = useCreateStore((state) => state.freeCount);
  const angleVariationIds = useCreateStore(
    (state) => state.angleVariationIds,
  );
  const generationRequested = useCreateStore(
    (state) => state.generationRequested,
  );
  const generationShots = useCreateStore(
    (state) => state.generationShots,
  );
  const generationMessage = useCreateStore(
    (state) => state.generationMessage,
  );
  const cutCount = getCutCount(
    contentSet,
    freeCount,
    angleVariationIds,
  );
  const hasGenerationMode = Boolean(
    contentSet || angleVariationIds.length > 0,
  );

  return (
    <Canvas>
      <Header>
        <HeaderText>
          <h2 className="type-xsmall-body">
            {generationRequested ? "생성 결과" : "스테이징 캔버스"}
          </h2>
          <p className="type-xsmall-thin">
            {generationRequested
              ? generationMessage
              : "좌측에서 재료를 준비하고 우측에서 생성을 실행하세요."}
          </p>
        </HeaderText>
        {hasGenerationMode ? (
          <span className="type-xsmall-thin">{cutCount}컷 예정</span>
        ) : null}
      </Header>
      <Stage>
        <ImageStage>
          {generationRequested ? (
            <GenerationProgressGrid shots={generationShots} />
          ) : productImage || referenceImage ? (
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
          ) : (
            <Empty>
              <ImageIcon size={42} strokeWidth={1.3} />
              <strong>생성할 재료를 준비해 주세요.</strong>
              <p className="type-xsmall-thin">
                내 제품 이미지를 등록하면 미리보기가 표시됩니다.
              </p>
            </Empty>
          )}
        </ImageStage>
      </Stage>
    </Canvas>
  );
}
