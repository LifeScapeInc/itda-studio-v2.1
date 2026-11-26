"use client";

import { useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ModalCloseAction, IconAction } from "@/components/ui/workbench";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import styled from "styled-components";
import { GenerationInputImages } from "@/components/ui/generation-input-images";
import type { LibraryGenerationShot } from "@/system/create/generation-library";

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 32px;
  background: rgb(32 29 23 / 32%);
`;

const Modal = styled.section`
  display: flex;
  width: min(680px, 100%);
  height: min(680px, calc(100dvh - 64px));
  min-height: min(360px, calc(100dvh - 64px));
  border: 1px solid var(--color-border);
  border-radius: 7px;
  flex-direction: column;
  background: var(--color-surface);
  box-shadow: 0 16px 48px rgb(32 29 23 / 18%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  flex: 0 0 45px;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
  h2 { min-width: 0; margin: 0; font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

const InfoHeading = styled.div`display: flex; flex: 1; min-width: 0; align-items: center; gap: 8px; h2 { flex: 1; } span { color: var(--color-label-studio-comment); font-size: 12px; white-space: nowrap; }`;

const Content = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--color-surface);
`;

const Metadata = styled.dl`
  display: grid;
  min-height: 0;
  flex: 1;
  margin: 0;
  padding: 20px 24px 24px;
  grid-template-columns: 112px minmax(0, 1fr);
  align-content: start;
  gap: 16px 16px;
  scrollbar-width: thin;
  overflow-y: auto;
  font-size: 12px;

  dt {
    color: var(--color-label-studio-comment);
    line-height: 1.7;
  }

  dd {
    margin: 0;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
`;

export function GeneratedMetadataModal({
  shots,
  onClose,
}: {
  shots: LibraryGenerationShot[];
  onClose: () => void;
}) {
  const bodyRef = useRef<HTMLDListElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  useDialogFocus(modalRef, onClose);

  const [index, setIndex] = useState(0);
  const shot = shots[Math.min(index, shots.length - 1)];
  const metadata = shot.metadata;
  const entries = [
    ["최종 프롬프트", metadata.finalPrompt],
    ["생성 시각", new Date(metadata.generatedAt).toLocaleString("ko-KR")],
    ["AI 모델", metadata.aiModel],
    ["지정 브랜드", (metadata.brandSelection ?? metadata.generationSettings?.brandSelection)?.name ?? "미지정"],
    ["브랜드 ID", (metadata.brandSelection ?? metadata.generationSettings?.brandSelection)?.id ?? "미지정"],
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
      <Modal ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="metadata-title">
        <Header>
          <InfoHeading>
            {shots.length > 1 && <IconAction type="button" aria-label="이전 이미지 정보" disabled={index === 0} onClick={() => { setIndex(value => value - 1); bodyRef.current?.scrollTo(0, 0); }}><ChevronLeft /></IconAction>}
            <h2 id="metadata-title">{shot.label} 정보</h2>
            {shots.length > 1 && <><span>{index + 1} / {shots.length}</span><IconAction type="button" aria-label="다음 이미지 정보" disabled={index === shots.length - 1} onClick={() => { setIndex(value => value + 1); bodyRef.current?.scrollTo(0, 0); }}><ChevronRight /></IconAction></>}
          </InfoHeading>
          <ModalCloseAction type="button" title="닫기" aria-label="정보 닫기" onClick={onClose}>
            <X />
          </ModalCloseAction>
        </Header>
        <Content>
          <Metadata ref={bodyRef}>
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
