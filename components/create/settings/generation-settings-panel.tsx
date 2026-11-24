"use client";

import { memo, useState } from "react";
import styled from "styled-components";
import { ChevronDown, ChevronRight, ChevronLeft, CircleHelp } from "lucide-react";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { SETTINGS_PANEL_MAX_WIDTH, SETTINGS_PANEL_MIN_WIDTH } from "@/system/layout/workspace-layout";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { PanelTabs, PanelTab, WorkbenchSectionHeader, handleTabKeys } from "@/components/ui/workbench";
import { BatchGenerationList } from "./batch-generation-list";
import { ExpertSettings } from "./expert-settings";
import { GenerationAction, RegenerationAction } from "./generation-action";
import { TooltipIconAction } from "@/components/ui/tooltip-icon-action";
import { EditableTitle } from "@/components/ui/editable-title";
import { PromptPreview } from "./prompt-preview";

const Panel = styled.aside`position: relative; display: flex; min-width: 0; min-height: 0; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface);`;
const Scroll = styled.div`display: flex; flex-direction: column; min-height: 0; flex: 1; padding: 16px 16px 16px; overflow: hidden;`;
const SettingsSection = styled.div`
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  > section { display: flex; flex: 1; min-height: 0; flex-direction: column; }
`;
const ExpertBody = styled.div`flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin;`;
const Preview = styled.div`display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 28px; margin-bottom: 8px; flex-shrink: 0;`;
const Divider = styled.hr`flex-shrink: 0; margin: 0 -16px; border: 0; border-top: 1px solid var(--color-border);`;
const Empty = styled.div`display: grid; flex: 1; place-items: center; padding: 24px; color: var(--color-label-studio-comment); font-size: 14px; text-align: center;`;
const Evaluation = styled.div`
  display: flex; flex: 1; min-height: 0; overflow-y: auto; flex-direction: column; gap: 8px; padding: 16px 16px 16px;
  > section + section { margin-top: 16px; }
  h3 { margin: 0 0 12px; font-size: 14px; font-weight: 500; }
  .score { font-size: 40px; line-height: 48px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .out-of { margin-left: 8px; font-size: 13px; color: var(--color-label-studio-comment); }
  .score-row { display: flex; align-items: center; justify-content: space-between; }
  .score-row h3 { margin: 0; }
  .gauge { height: 8px; margin-top: 12px; border-radius: 4px; background: var(--color-main-neutral); }
  .gauge-fill { height: 100%; border-radius: 4px; background: var(--color-primary, #608b70); }
  .range { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--color-label-studio-comment); }
  p { color: var(--color-label-studio-comment); font-size: 11px; }
`;

const SettingsTitle = styled.div`flex: 1; min-width: 0; text-align: left; font-size: 14px; font-weight: 500; line-height: 1.4;`;
const EvaluationTitle = styled.div`display: flex; align-items: center; gap: 4px; h3 { margin: 0; }`;
const ImageHeading = styled.div`min-height: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; h3 { flex: 1; min-width: 0; margin: 0; line-height: 1.4; text-align: center; overflow-wrap: anywhere; }`;
const EVALUATION_ITEMS = [
  { label: "객체 무결성", description: "생성된 이미지 속 제품이 원본 제품의 형태, 부품, 색상과 디테일을 얼마나 잘 유지하고 있는지 보여줍니다." },
  { label: "기술적 품질", description: "제품이 선명하게 보이는지, 색이 지나치게 진하거나 밝고 어두운 부분이 과해 제품의 디테일이 사라지지 않았는지 보여줍니다." },
  { label: "브랜드 적합성", description: "이미지의 공간, 색감, 조명과 소품이 선택한 브랜드 참고 이미지의 분위기 및 제품 스타일과 얼마나 잘 어울리는지 보여줍니다." },
];

export const GenerationSettingsPanel = memo(function GenerationSettingsPanel() {
  const tab = useCreateStore(s => s.generationPanelTab);
  const setTab = useCreateStore(s => s.setGenerationPanelTab);
  const [expertOpen, setExpertOpen] = useState(true);
  const width = useWorkspaceLayoutStore(s => s.settingsPanelWidth);
  const resize = useWorkspaceLayoutStore(s => s.resizeSettingsPanel);
  const selectedId = useCreateStore(s => s.selectedShotId);
  const selected = useCreateStore(s => s.generationShots.find(shot => shot.id === selectedId && shot.status === "done" && shot.imageUrl));
  const selectedIds = useCreateStore(s => s.selectedShotIds);
  const shots = useCreateStore(s => s.generationShots);
  const navigateSelection = useCreateStore(s => s.navigateSelection);
  const selectedShots = shots.filter(shot => selectedIds.includes(shot.id) && shot.status === "done" && shot.imageUrl);
  const currentIndex = selectedShots.findIndex(shot => shot.id === selectedId);
  const history = useCreateStore(s => s.generationHistory);
  const activeHistoryId = useCreateStore(s => s.activeHistoryId);
  const draftTitle = useCreateStore(s => s.draftTitle);
  const renameDraft = useCreateStore(s => s.renameDraft);
  const renameHistory = useCreateStore(s => s.renameHistory);
  const renameShot = useCreateStore(s => s.renameShot);
  const activeHistory = history.find(item => item.id === activeHistoryId);
  const fidelity = selected?.fidelity;
  const fidelityScore = fidelity?.status === "scored" ? fidelity.score : undefined;
  const scoreLabel = fidelityScore === undefined ? "—" : fidelityScore.toFixed(1);
  const evaluationMessage = fidelity?.status === "not_applicable"
      ? fidelity.reason
      : fidelity?.status === "scored"
        ? "객체 무결성 점수를 표시합니다."
        : "평가 점수가 없습니다.";
  return <Panel aria-label="생성 측면 패널">
    <PanelResizeHandle previewProperty="--settings-width" gap={8} edge="left" label="생성 설정 너비 조절" value={width} minimum={SETTINGS_PANEL_MIN_WIDTH} maximum={SETTINGS_PANEL_MAX_WIDTH} onResize={resize} />
    <PanelTabs role="tablist" aria-label="측면 패널" onKeyDown={handleTabKeys}>
      <PanelTab role="tab" id="generation-settings-tab" aria-controls="generation-settings-content" aria-selected={tab === "settings"} $active={tab === "settings"} onClick={() => setTab("settings")}>생성 설정</PanelTab>
      <PanelTab role="tab" id="evaluation-tab" aria-controls="evaluation-content" aria-selected={tab === "evaluation"} $active={tab === "evaluation"} onClick={() => setTab("evaluation")}>평가</PanelTab>
    </PanelTabs>
    {tab === "settings" ? <><Scroll role="tabpanel" id="generation-settings-content" aria-labelledby="generation-settings-tab">
      <Preview><SettingsTitle><EditableTitle key={activeHistory?.id ?? "draft"} label="생성 제목" value={activeHistory?.title ?? draftTitle} onSave={title => activeHistory ? renameHistory(activeHistory.id, title) : renameDraft(title)} /></SettingsTitle><PromptPreview /></Preview>
      <SettingsSection><BatchGenerationList /></SettingsSection>
      <Divider />
      <SettingsSection><WorkbenchSectionHeader><button type="button" aria-expanded={expertOpen} onClick={() => setExpertOpen(value => !value)}>{expertOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}전문가 설정 (선택)</button></WorkbenchSectionHeader>
      {expertOpen && <ExpertBody><ExpertSettings /></ExpertBody>}</SettingsSection>
    </Scroll><GenerationAction /></> : <>{fidelity?.status === "unavailable" ? <Empty role="tabpanel" id="evaluation-content" aria-labelledby="evaluation-tab">서버가 정상적으로 연결되어 있지 않습니다</Empty> : selected ? <Evaluation role="tabpanel" id="evaluation-content" aria-labelledby="evaluation-tab">
      <ImageHeading><TooltipIconAction caption="이전 이미지" disabled={currentIndex <= 0} onClick={() => navigateSelection(-1)}><ChevronLeft /></TooltipIconAction><h3><EditableTitle key={selected.id} label="이미지 제목" value={selected.label} onSave={title => renameShot(selected.id, title)} /></h3><TooltipIconAction caption="다음 이미지" disabled={currentIndex < 0 || currentIndex >= selectedShots.length - 1} onClick={() => navigateSelection(1)}><ChevronRight /></TooltipIconAction></ImageHeading>
      <section><EvaluationTitle><h3>종합 점수</h3><TooltipIconAction type="button" multiline aria-label="종합 점수 설명" caption="현재는 객체 무결성 점수를 종합 점수로 표시합니다."><CircleHelp /></TooltipIconAction></EvaluationTitle><span className="score">{scoreLabel}</span><span className="out-of">/ 100</span><p>{evaluationMessage}</p></section>
      {EVALUATION_ITEMS.map(({ label, description }) => {
        const score = label === "객체 무결성" ? fidelityScore : undefined;
        return <section key={label}><div className="score-row"><EvaluationTitle><h3>{label}</h3><TooltipIconAction type="button" multiline aria-label={`${label} 설명`} caption={description}><CircleHelp /></TooltipIconAction></EvaluationTitle><span>{score === undefined ? "—" : score.toFixed(1)} <span className="out-of">/ 100</span></span></div><div className="gauge" aria-label={score === undefined ? `${label} 점수 없음` : `${label} ${score.toFixed(1)}점`}>{score !== undefined && <div className="gauge-fill" style={{ width: `${score}%` }} />}</div><div className="range"><span>0</span><span>100</span></div></section>;
      })}
    </Evaluation> : <Empty role="tabpanel" id="evaluation-content" aria-labelledby="evaluation-tab">선택된 생성물이 없습니다</Empty>}{fidelity?.status !== "unavailable" && <RegenerationAction />}</>}
  </Panel>;
});
