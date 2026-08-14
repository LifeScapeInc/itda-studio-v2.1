"use client";

import { useEffect } from "react";
import Image from "next/image";
import styled from "styled-components";
import { GenerationInputImages } from "@/components/ui/generation-input-images";
import type { LibraryGenerationShot } from "@/system/create/generation-library";

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-xl);
  background: rgb(32 29 23 / 32%);
`;

const Modal = styled.section`
  display: flex;
  width: min(680px, 100%);
  height: min(680px, calc(100vh - 64px));
  min-height: 520px;
  flex-direction: column;
  background: var(--color-surface);
  box-shadow: 0 20px 52px rgb(32 29 23 / 22%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-main-neutral-light);
`;

const Close = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  margin: -6px -6px 0 0;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgb(32 29 23 / 5%);
    outline: none;
  }
`;

const Content = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
`;

const Metadata = styled.dl`
  display: grid;
  min-height: 0;
  flex: 1;
  margin: 0;
  padding: var(--space-lg);
  grid-template-columns: 112px minmax(0, 1fr);
  align-content: start;
  gap: var(--space-sm) var(--space-xs);
  overflow-y: auto;
  font-size: 12px;

  dt {
    color: var(--color-label-studio-comment);
  }

  dd {
    margin: 0;
    line-height: 1.5;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`;

export function GeneratedMetadataModal({
  shot,
  onClose,
}: {
  shot: LibraryGenerationShot;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const metadata = shot.metadata;
  const entries = [
    ["최종 프롬프트", metadata.finalPrompt],
    ["생성 시각", new Date(metadata.generatedAt).toLocaleString("ko-KR")],
    ["AI 모델", metadata.aiModel],
    ["생성 종류", metadata.variationType],
    ["품질", metadata.quality],
    ["AI 편집", metadata.editMode || "기본"],
    ["채광/시간대", metadata.light],
    ["인테리어 무드", metadata.mood],
    ["연출 소품", metadata.props.length ? metadata.props.join(", ") : "없음"],
    ["추가 디렉션", metadata.additionalDirection || "없음"],
    ["이미지 크기", metadata.imageSize],
  ];

  return (
    <Backdrop onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="metadata-title">
        <Header>
          <h2 id="metadata-title" className="type-small-head">
            {shot.label} 정보
          </h2>
          <Close type="button" aria-label="정보 닫기" onClick={onClose}>
            <Image
              src="/assets/project-overlay-close.svg"
              alt=""
              width={12}
              height={12}
            />
          </Close>
        </Header>
        <Content>
          <Metadata>
            {metadata.inputImages?.length ? (
              <div style={{ display: "contents" }}>
                <dt>입력 이미지</dt>
                <dd>
                  <GenerationInputImages images={metadata.inputImages} />
                </dd>
              </div>
            ) : null}
            {entries.map(([label, value]) => (
              <div style={{ display: "contents" }} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </Metadata>
        </Content>
      </Modal>
    </Backdrop>
  );
}
