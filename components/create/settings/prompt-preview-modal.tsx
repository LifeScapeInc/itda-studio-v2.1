"use client";

import { useEffect } from "react";
import Image from "next/image";
import styled from "styled-components";
import type { GenerationQuality } from "@/system/create/generation-options";
import type { GenerationPrompt } from "@/system/create/generation-prompt";

const QUALITY_LABELS: Record<GenerationQuality, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const Backdrop = styled.div`
  position: fixed;
  z-index: 140;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-xl);
  background: rgb(32 29 23 / 32%);
`;

const Modal = styled.section`
  display: flex;
  width: min(720px, 100%);
  height: min(760px, calc(100vh - 64px));
  min-height: 520px;
  flex-direction: column;
  background: var(--color-surface);
  box-shadow: 0 20px 52px rgb(32 29 23 / 22%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-main-neutral-light);
`;

const Heading = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2xs);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.45;
  }
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
`;

const Badge = styled.span`
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: 6px;
  background: var(--color-main-neutral);
  color: var(--color-label-studio-comment);
  font-size: 11px;
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
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PromptCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
`;

const PromptText = styled.pre`
  margin: 0;
  color: var(--color-label-studio-black);
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Translation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  padding: 10px;
  border-radius: 8px;
  background: var(--color-main-neutral-light);
`;

const TranslationLabel = styled.span`
  color: var(--color-label-studio-comment);
  font-size: 11px;
  font-weight: 700;
`;

const Empty = styled.div`
  display: grid;
  min-height: 220px;
  place-items: center;
  color: var(--color-label-studio-comment);
  text-align: center;
`;

export function PromptPreviewModal({
  contentSetLabel,
  quality,
  prompts,
  koreanPrompts,
  onClose,
}: {
  contentSetLabel: string;
  quality: GenerationQuality;
  prompts: GenerationPrompt[];
  koreanPrompts: Record<string, string>;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-preview-title"
      >
        <Header>
          <Heading>
            <h2
              className="type-small-head"
              id="prompt-preview-title"
            >
              최종 생성 프롬프트
            </h2>
            <p className="type-xsmall-thin">
              영어 원문만 실제 생성 요청에 전달됩니다. 아래 한국어는 읽기용 번역이며 API에 전송되지 않습니다.
            </p>
            <Meta>
              <Badge>{contentSetLabel}</Badge>
              <Badge>품질 {QUALITY_LABELS[quality]}</Badge>
              {prompts.length > 0 ? <Badge>{prompts.length}개 프롬프트</Badge> : null}
            </Meta>
          </Heading>
          <Close
            type="button"
            aria-label="프롬프트 모달 닫기"
            onClick={onClose}
          >
            <Image
              src="/assets/project-overlay-close.svg"
              alt=""
              width={12}
              height={12}
            />
          </Close>
        </Header>
        <Content>
          {prompts.length > 0 ? (
            prompts.map((item, index) => (
              <PromptCard key={item.id}>
                <strong className="type-xsmall-body">
                  {index + 1}. {item.label}
                </strong>
                <PromptText>{item.prompt}</PromptText>
                {koreanPrompts[item.id] ? (
                  <Translation>
                    <TranslationLabel>한국어 번역 · 확인용</TranslationLabel>
                    <PromptText>{koreanPrompts[item.id]}</PromptText>
                  </Translation>
                ) : null}
              </PromptCard>
            ))
          ) : (
            <Empty className="type-xsmall-thin">
              콘텐츠 세트 또는 앵글 변주를 선택하면 최종 프롬프트를 확인할 수 있습니다.
            </Empty>
          )}
        </Content>
      </Modal>
    </Backdrop>
  );
}
