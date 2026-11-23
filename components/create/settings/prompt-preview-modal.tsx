"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import styled from "styled-components";
import type { GenerationPrompt } from "@/system/create/generation-prompt";
import type { GenerationQuality } from "@/system/create/generation-options";
import { useCreateStore } from "@/stores/useCreateStore";
import { expandBatch, GENERATION_PRESETS, PURPOSE_OPTIONS, COMPOSITION_OPTIONS } from "@/system/create/generation-batch";
import { ModalCloseAction } from "@/components/ui/workbench";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

const Backdrop = styled.div`position: fixed; z-index: 110; inset: 0; display: grid; place-items: center; padding: 32px; background: rgb(32 29 23 / 32%);`;
const Modal = styled.section`display: flex; width: min(1120px, 100%); height: min(720px, calc(100dvh - 64px)); min-height: 360px; flex-direction: column; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface); box-shadow: 0 16px 48px rgb(32 29 23 / 18%); overflow: hidden;`;
const Header = styled.header`display: flex; flex: 0 0 45px; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--color-main-neutral-light); border-bottom: 1px solid var(--color-border); h2 { font-size: 16px; font-weight: 500; }`;
const Summary = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 56px; padding: 12px 20px; font-size: 12px; color: var(--color-label-studio-comment); > div { display: flex; gap: 6px; flex-shrink: 0; } span { padding: 4px 8px; background: var(--color-main-neutral-light); border-radius: 4px; font-size: 11px; }`;
const Body = styled.div`display: grid; grid-template-columns: 208px minmax(0, 1fr); min-height: 0; flex: 1; margin: 0 16px 16px;`;
const Nav = styled.nav`padding: 0 12px 12px 0; min-height: 0; overflow-y: auto; border-right: 1px solid var(--color-border); button { width: 100%; padding: 8px; border: 0; border-radius: 4px; background: transparent; font-size: 12px; text-align: left; cursor: pointer; } button[aria-current="true"] { background: var(--color-main-neutral); } button:hover { background: var(--color-main-neutral-light); } .preset-name { display: block; padding: 16px 8px 4px; font-size: 12px; font-weight: 500; } small { display: block; margin-top: 4px; font-size: 10px; color: var(--color-label-studio-comment); }`;
const Content = styled.div`padding: 0 20px 16px 24px; min-height: 0; overflow-y: auto; scroll-behavior: smooth; article { padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); scroll-margin-top: 4px; } h3 { margin: 0 0 16px; font-size: 16px; font-weight: 500; } pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-family: inherit; font-size: 13px; line-height: 23px; }`;
const Empty = styled.div`display: grid; place-items: center; min-height: 240px; color: var(--color-label-studio-comment); font-size: 13px;`;

export function PromptPreviewModal({ contentSetLabel, quality, prompts, onClose }: { contentSetLabel: string; quality: GenerationQuality; prompts: GenerationPrompt[]; onClose: () => void; }) {
  const modalRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useDialogFocus(modalRef, onClose);
  const entries = useCreateStore(s => s.batchEntries);
  const expanded = expandBatch(entries);
  const [active, setActive] = useState(prompts[0]?.id ?? "");
  const select = (id: string) => { setActive(id); contentRef.current?.querySelector<HTMLElement>(`[data-prompt-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" }); };
  return <Backdrop onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><Modal ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="prompt-preview-title">
    <Header><h2 id="prompt-preview-title">최종 생성 프롬프트</h2><ModalCloseAction title="닫기" aria-label="프롬프트 모달 닫기" onClick={onClose}><X /></ModalCloseAction></Header>
    <Summary><p>현재 설정으로 실제 생성 요청에 전달될 컷별 텍스트입니다.</p><div><span>{contentSetLabel}</span><span>{({ low: "Draft", medium: "Normal", high: "High" })[quality]}</span><span>설정 {entries.length}개 · 총 {prompts.length}장</span></div></Summary>
    <Body><Nav aria-label="생성 프롬프트 탐색">{entries.map((entry, index) => <section key={entry.id}>{entry.kind === "preset" && <strong className="preset-name">{GENERATION_PRESETS[entry.presetId].label} · {entry.quantity}세트</strong>}{expanded.filter(shot => shot.makeId === entry.id).map((shot, i) => <button key={shot.id} aria-current={active === shot.id ? "true" : undefined} onClick={() => select(shot.id)}>{entry.kind === "make" ? `생성 ${String(index + 1).padStart(2, "0")}${entry.quantity > 1 ? ` · ${i + 1}` : ""}` : shot.label}<small>{PURPOSE_OPTIONS.find(p => p.id === shot.purpose)?.label} · {COMPOSITION_OPTIONS.find(c => c.id === shot.composition)?.label} · {shot.ratio}</small></button>)}</section>)}</Nav><Content ref={contentRef}>{prompts.length ? prompts.map((item, index) => <article key={item.id} data-prompt-id={item.id}><h3>{String(index + 1).padStart(2, "0")}　{item.label}</h3><pre>{item.prompt}</pre></article>) : <Empty>생성을 추가하면 최종 프롬프트를 확인할 수 있습니다.</Empty>}</Content></Body>
  </Modal></Backdrop>;
}
