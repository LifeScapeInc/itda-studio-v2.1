"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Plus, Trash2, X } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { COMPOSITION_OPTIONS, GENERATION_PRESETS, PURPOSE_OPTIONS, type BatchEntry } from "@/system/create/generation-batch";
import { IconAction, WorkbenchSectionHeader } from "@/components/ui/workbench";
import { TooltipIconAction } from "@/components/ui/tooltip-icon-action";
import { PurposeDropdown } from "./purpose-dropdown";
import { CompositionDropdown } from "./composition-dropdown";
import { RatioDropdown } from "./ratio-dropdown";
import { PresetPicker } from "./preset-picker";

const Table = styled.div`min-height: 0; flex: 1; overflow-y: auto; scrollbar-width: thin; font-size: 11px;`;
const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 86fr) minmax(0, 82fr) minmax(0, 54fr) 40px 16px;
  gap: 8px;
  align-items: center;
`;
const ColumnHead = styled(Columns)`height: 24px; border-bottom: 1px solid var(--color-border); color: var(--color-label-studio-comment); font-weight: 500; > span { padding-left: 8px; } > span:last-child { padding: 0; text-align: center; }`;
const Row = styled(Columns)`min-height: 37px; padding: 4px 0; border-bottom: 1px solid var(--color-border);`;
const Quantity = styled.input`
  width: 40px; height: 28px; padding: 0 2px; border: 0; border-radius: 4px; background: transparent; font: inherit; font-size: 13px; text-align: center; font-variant-numeric: tabular-nums;
  &::-webkit-inner-spin-button { opacity: 1; }
  &:hover { background: var(--color-main-neutral-light); }
`;
const Delete = styled(IconAction)`width: 16px; flex-basis: 16px; svg { width: 12px; height: 12px; }`;
const Preset = styled.div`padding: 4px 0; border-bottom: 1px solid var(--color-border);`;
const PresetRow = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;`;
const PresetBody = styled.div`flex: 1; min-width: 0; border-radius: 4px; background: var(--color-main-neutral-light);`;
const PresetToggle = styled.button`display: flex; align-items: center; gap: 8px; width: 100%; height: 28px; padding: 0 8px; border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; svg { width: 12px; height: 12px; color: var(--color-label-studio-comment); }`;
const PresetContent = styled.div`
  padding: 4px 8px 8px;
  > div { display: grid; grid-template-columns: 86fr 82fr 54fr; gap: 8px; align-items: center; min-height: 26px; color: var(--color-label-assistive); font-size: 10px; }
  span { padding-left: 8px; }
`;
const Trailing = styled.div`display: flex; align-items: center; gap: 8px;`;
const Empty = styled.p`padding: 16px 8px; color: var(--color-label-studio-comment); font-size: 12px; line-height: 1.6;`;

function Entry({ entry, index, disabled }: { entry: BatchEntry; index: number; disabled: boolean; }) {
  const [expanded, setExpanded] = useState(false);
  const update = useCreateStore(s => s.updateMake);
  const setQuantity = useCreateStore(s => s.setEntryQuantity);
  const remove = useCreateStore(s => s.removeEntry);
  const trailing = <Trailing><Quantity type="number" min={1} max={20} step={1} aria-label={`생성 ${index + 1} 수량`} value={entry.quantity} disabled={disabled} onChange={e => setQuantity(entry.id, e.currentTarget.valueAsNumber)} /><Delete type="button" title="생성 삭제" aria-label={`생성 ${index + 1} 삭제`} disabled={disabled} onClick={() => remove(entry.id)}><X /></Delete></Trailing>;
  if (entry.kind === "preset") {
    const preset = GENERATION_PRESETS[entry.presetId];
    return <Preset><PresetRow><PresetBody><PresetToggle type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronDown /> : <ChevronRight />}{preset.label}</PresetToggle>{expanded && <PresetContent aria-label={`${preset.label} 프리셋 구성`}>{preset.makes.map((make, i) => <div key={i}><span>{PURPOSE_OPTIONS.find(p => p.id === make.purpose)?.label}</span><span>{COMPOSITION_OPTIONS.find(c => c.id === make.composition)?.label}</span><span>{make.ratio}</span></div>)}</PresetContent>}</PresetBody>{trailing}</PresetRow></Preset>;
  }
  return <Row>
    <PurposeDropdown label={`생성 ${index + 1} 용도`} value={entry.purpose} disabled={disabled} onChange={purpose => update(entry.id, { purpose })} />
    <CompositionDropdown label={`생성 ${index + 1} 구도`} value={entry.composition} disabled={disabled} onChange={composition => update(entry.id, { composition })} />
    <RatioDropdown label={`생성 ${index + 1} 비율`} value={entry.ratio} disabled={disabled} onChange={ratio => update(entry.id, { ratio })} />
    <Quantity type="number" min={1} max={20} aria-label={`생성 ${index + 1} 수량`} value={entry.quantity} disabled={disabled} onChange={e => setQuantity(entry.id, e.currentTarget.valueAsNumber)} />
    <Delete type="button" title="생성 삭제" aria-label={`생성 ${index + 1} 삭제`} disabled={disabled} onClick={() => remove(entry.id)}><X /></Delete>
  </Row>;
}

export function BatchGenerationList() {
  const state = useCreateStore();
  const [open, setOpen] = useState(true);
  const [presetsOpen, setPresetsOpen] = useState(false);
  return <section aria-label="생성 목록">
    <WorkbenchSectionHeader>
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}생성 목록</button>
      {open && <>
      <TooltipIconAction caption="생성 추가" aria-label="생성 추가" onClick={() => { state.addMake(); setOpen(true); }}><Plus /></TooltipIconAction>
      <TooltipIconAction caption="프리셋 추가" aria-label="프리셋 추가" aria-haspopup="dialog" onClick={() => setPresetsOpen(true)}><Layers /></TooltipIconAction>
      <TooltipIconAction caption="전체 삭제" aria-label="생성 전체 삭제" disabled={!state.batchEntries.length} onClick={state.clearEntries}><Trash2 /></TooltipIconAction>
      </>}
    </WorkbenchSectionHeader>
    {open && <Table><ColumnHead><span>용도</span><span>구도</span><span>비율</span><span>수량</span></ColumnHead>{state.batchEntries.map((entry, index) => <Entry key={entry.id} entry={entry} index={index} disabled={false} />)}{!state.batchEntries.length && <Empty>오른쪽 + 버튼으로 생성을 추가하거나 프리셋을 선택해 주세요.</Empty>}</Table>}
    {presetsOpen && <PresetPicker onClose={() => setPresetsOpen(false)} onAdd={id => { state.addPreset(id); setOpen(true); }} />}
  </section>;
}
