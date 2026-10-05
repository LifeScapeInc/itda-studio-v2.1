"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { getGenerationModeLabel } from "@/system/create/generation-prompt";
import { ContentSetSelector } from "./content-set-selector";
import { ImageQualityControl } from "./image-quality-control";
import { ImageRatioControl } from "./image-ratio-control";

const Trigger = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-black);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    color: var(--color-main-primary);
    outline: none;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  z-index: 150;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(0 0 0 / 56%);
`;

const Modal = styled.section`
  width: min(900px, calc(100vw - 32px));
  max-height: min(820px, calc(100dvh - 32px));
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-black);
  box-shadow: 0 24px 70px rgb(0 0 0 / 28%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border);

  h2 { margin: 0; font-size: 18px; }
  p { margin: 5px 0 0; color: var(--color-label-studio-comment); font-size: 12px; }
`;

const Close = styled.button`
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;

  &:hover,
  &:focus-visible { background: var(--color-main-neutral); color: var(--color-label-studio-black); outline: none; }
`;

const ScrollArea = styled.div`
  max-height: min(680px, calc(100dvh - 178px));
  padding: 20px 24px;
  overflow-y: auto;
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;

  > section { height: 100%; }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const ContentSet = styled.section`
  margin-top: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);

  h3 { margin: 0 0 10px; font-size: 12px; }
`;

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);

  span { color: var(--color-label-studio-comment); font-size: 11px; }
  button {
    min-width: 88px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: var(--color-label-studio-black);
    color: var(--color-surface);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  button:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 2px; }
`;

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const contentSet = useCreateStore(state => state.contentSet);
  const angleVariationIds = useCreateStore(state => state.angleVariationIds);
  const ratio = useCreateStore(state => state.aspectRatio);
  const useSetRatios = useCreateStore(state => state.useSetRatios);
  const quality = useCreateStore(state => state.quality);
  const ratioLabel = useSetRatios && contentSet && contentSet !== "free" && angleVariationIds.length === 0
    ? "세트별 비율"
    : ratio;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const modal = closeRef.current?.closest('[role="dialog"]');
      const focusable = modal?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <Backdrop
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <Modal role="dialog" aria-modal="true" aria-labelledby="generation-top-settings-title">
        <Header>
          <div>
            <h2 id="generation-top-settings-title">생성 설정</h2>
            <p>출력 형식과 생성 방식을 먼저 정하고, 세부 연출은 오른쪽 패널에서 조정하세요.</p>
          </div>
          <Close ref={closeRef} type="button" aria-label="생성 설정 닫기" onClick={onClose}><X size={17} /></Close>
        </Header>
        <ScrollArea>
          <TopGrid>
            <ImageRatioControl />
            <ImageQualityControl />
          </TopGrid>
          <ContentSet>
            <h3>콘텐츠 세트 선택</h3>
            <ContentSetSelector layout="grid" />
          </ContentSet>
        </ScrollArea>
        <Footer>
          <span>{getGenerationModeLabel(contentSet, angleVariationIds)} · {ratioLabel} · {quality.toUpperCase()}</span>
          <button type="button" onClick={onClose}>완료</button>
        </Footer>
      </Modal>
    </Backdrop>
  );
}

export function GenerationTopSettings() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Trigger
        type="button"
        aria-label="생성 설정 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="이미지 비율·품질·콘텐츠 세트 설정"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={17} strokeWidth={1.8} />
      </Trigger>
      {open ? <SettingsDialog onClose={close} /> : null}
    </>
  );
}
