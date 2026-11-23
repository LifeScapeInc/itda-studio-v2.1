"use client";

import { useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Layers, X } from "lucide-react";
import styled from "styled-components";
import { COMPOSITION_OPTIONS, GENERATION_PRESETS, PURPOSE_OPTIONS, type PresetId } from "@/system/create/generation-batch";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import { IconAction } from "@/components/ui/workbench";

import detailSample1 from "@/public/assets/create/detail_1.webp";
import detailSample2 from "@/public/assets/create/detail_2.webp";
import detailSample3 from "@/public/assets/create/detail_3.webp";
import detailSample4 from "@/public/assets/create/detail_4.webp";
import snsSample1 from "@/public/assets/create/SNS_1.webp";
import snsSample2 from "@/public/assets/create/SNS_2.webp";
import snsSample3 from "@/public/assets/create/SNS_3.webp";
import snsSample4 from "@/public/assets/create/SNS_4.webp";
import adSample1 from "@/public/assets/create/ads_1.webp";
import adSample2 from "@/public/assets/create/ads_2.webp";
import adSample3 from "@/public/assets/create/ads_3.webp";
import lookbookSample1 from "@/public/assets/create/lookbook_1.webp";
import lookbookSample2 from "@/public/assets/create/lookbook_2.webp";
import lookbookSample3 from "@/public/assets/create/lookbook_3.webp";
import lookbookSample4 from "@/public/assets/create/lookbook_4.webp";
import angleSample1 from "@/public/assets/create/angle_1.png";
import angleSample2 from "@/public/assets/create/angle_2.png";
import angleSample3 from "@/public/assets/create/angle_3.png";
import angleSample4 from "@/public/assets/create/angle_4.png";
import angleSample5 from "@/public/assets/create/angle_5.png";

const PRESET_SAMPLES: Record<PresetId, StaticImageData[]> = {
  detail: [detailSample1, detailSample2, detailSample3, detailSample4],
  sns: [snsSample1, snsSample2, snsSample3, snsSample4],
  ad: [adSample1, adSample2, adSample3],
  lookbook: [lookbookSample1, lookbookSample2, lookbookSample3, lookbookSample4],
  angle: [angleSample1, angleSample2, angleSample3, angleSample4, angleSample5],
};

const Backdrop = styled.div`position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgb(32 29 23 / 32%);`;
const Dialog = styled.section`display: flex; width: min(760px, 100%); height: auto; max-height: calc(100dvh - 32px); flex-direction: column; overflow: hidden; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface); box-shadow: 0 16px 48px rgb(32 29 23 / 18%);`;
const Header = styled.header`display: flex; flex: 0 0 45px; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--color-main-neutral-light); border-bottom: 1px solid var(--color-border); h2 { font-size: 16px; font-weight: 500; }`;
const Body = styled.div`display: grid; flex: 1 1 auto; min-height: 0; grid-template-columns: 180px minmax(0, 1fr); nav { padding: 16px; border-right: 1px solid var(--color-border); overflow-y: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }`;
const Option = styled.button<{ $active: boolean; }>`display: flex; align-items: center; justify-content: space-between; width: 100%; height: 36px; padding: 0 8px; border: 0; border-radius: 4px; background: ${({ $active }) => $active ? "var(--color-main-neutral)" : "transparent"}; font-size: 13px; cursor: pointer; &:hover { background: var(--color-main-neutral-light); } span { color: var(--color-label-studio-comment); font-size: 11px; }`;
const Preview = styled.div`min-width: 0; padding: 24px; overflow-y: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; } h3 { margin: 0 0 8px; font-size: 18px; font-weight: 500; } p { margin-bottom: 20px; font-size: 12px; line-height: 1.6; color: var(--color-label-studio-comment); }`;
const Table = styled.div`padding: 8px; background: var(--color-main-neutral-light); border-radius: 4px; > div { display: grid; grid-template-columns: 1fr 1fr 64px; min-height: 36px; align-items: center; padding: 0 8px; font-size: 12px; } > div:first-child { color: var(--color-label-studio-comment); font-size: 11px; }`;
const Samples = styled.div`
  display: flex; flex-direction: column; gap: 12px; margin-top: 20px; min-width: 0;
`;
const SampleRow = styled.div`
  display: grid; gap: 8px; align-items: center; justify-items: center; min-width: 0;
  figure { width: 100%; min-width: 0; margin: 0; display: flex; justify-content: center; }
  img { display: block; width: auto; max-width: 100%; height: auto; max-height: 160px; object-fit: contain; border: 1px dashed var(--color-label-studio-comment); border-radius: 4px; }
`;
const Footer = styled.footer`display: flex; flex: 0 0 64px; align-items: center; justify-content: flex-end; gap: 8px; padding: 0 24px; border-top: 1px solid var(--color-border); button { height: 32px; padding: 0 12px; border: 0; border-radius: 4px; background: var(--color-main-neutral-light); font-size: 13px; cursor: pointer; } button:last-child { display: flex; align-items: center; gap: 8px; background: var(--color-main-primary); color: var(--color-surface); }`;

export function PresetPicker({ onClose, onAdd }: { onClose: () => void; onAdd: (id: PresetId) => void; }) {
  const [selected, setSelected] = useState<PresetId>("detail");
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, onClose);
  const preset = GENERATION_PRESETS[selected];
  const samples = PRESET_SAMPLES[selected];
  const rows = selected === "angle" ? [samples.slice(0, 3), samples.slice(3)] : [samples];
  return <Backdrop onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><Dialog ref={ref} role="dialog" aria-modal="true" aria-labelledby="preset-title">
    <Header><h2 id="preset-title">프리셋 추가</h2><IconAction aria-label="프리셋 선택 닫기" title="닫기" onClick={onClose}><X /></IconAction></Header>
    <Body><nav aria-label="프리셋 종류">{Object.entries(GENERATION_PRESETS).map(([id, value]) => <Option key={id} $active={selected === id} aria-pressed={selected === id} onClick={() => setSelected(id as PresetId)}>{value.label}<span>{value.makes.length}컷</span></Option>)}</nav><Preview><h3>{preset.label}</h3><p>{preset.makes.length}개의 생성으로 구성된 프리셋입니다.<br />추가 후 생성 목록에서 구성과 세트 수량을 확인할 수 있습니다.</p><Table><div><span>용도</span><span>구도</span><span>비율</span></div>{preset.makes.map((make, index) => <div key={index}><span>{PURPOSE_OPTIONS.find(o => o.id === make.purpose)?.label}</span><span>{COMPOSITION_OPTIONS.find(o => o.id === make.composition)?.label}</span><span>{make.ratio}</span></div>)}</Table><Samples aria-label={`${preset.label} 견본 이미지`}>
      {rows.map((images, rowIndex) => {
        const columns = images.map(image => `${Math.sqrt(image.width / image.height)}fr`);
        if (samples.length === 3) columns.push("1fr");
        return <SampleRow key={rowIndex} style={{ gridTemplateColumns: selected === "angle" ? "repeat(6, minmax(0, 1fr))" : columns.join(" ") }}>
          {images.map((image, index) => <figure key={image.src} style={selected === "angle" ? { gridColumn: rowIndex === 1 ? `${index * 2 + 2} / span 2` : "span 2" } : undefined}><Image src={image} alt={`${preset.label} 견본 ${rowIndex * 3 + index + 1}`} sizes="(max-width: 760px) 30vw, 220px" /></figure>)}
          {samples.length === 3 && <div aria-hidden="true" />}
        </SampleRow>;
      })}
    </Samples></Preview></Body>
    <Footer><button onClick={onClose}>취소</button><button onClick={() => { onAdd(selected); onClose(); }}><Layers size={14} />이 구성으로 추가</button></Footer>
  </Dialog></Backdrop>;
}
