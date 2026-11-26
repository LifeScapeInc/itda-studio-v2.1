"use client";
import { useEffect, useRef } from "react";
import { ChartNoAxesCombined, LoaderCircle, RefreshCw } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useBrandAnalysisStore } from "@/stores/useBrandAnalysisStore";
import { analysisIsPending, analysisMeasure } from "@/system/brand/brand-analysis";
const spin = keyframes`to { transform: rotate(360deg); }`;
const Panel = styled.section`
 display: flex; min-width: 0; min-height: 0; align-items: center; gap: 24px; padding: 16px;
 border: 1px solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface);
`;
const Placeholder = styled.div`
 display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; gap: 12px; color: var(--color-label-studio-comment);
 p { margin: 0; font-size: 13px; line-height: 1.6; }
 svg { flex-shrink: 0; }
`;
const Spinner = styled(LoaderCircle)`animation: ${spin} 850ms linear infinite; @media(prefers-reduced-motion: reduce) { animation: none; }`;
const Description = styled.p`
 margin: 0; min-width: 0; flex: 0 1 28%; max-width: 360px; font-size: 13px; line-height: 1.7; max-height: 100%; overflow-y: auto; overflow-wrap: anywhere;
`;
const Palette = styled.div`
 display: flex; min-width: 0; min-height: 0; flex: 0 1 auto; margin-right: auto; align-items: center; gap: 12px; overflow-x: auto;
`;
const Color = styled.div`
 display: flex; width: max-content; min-width: 64px; flex: 0 0 auto; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center;
 strong { font-size: 11px; font-weight: 500; white-space: nowrap; }
 small { font-size: 10px; color: var(--color-label-studio-comment); }
`;
const Swatch = styled.div<{ $color?: string }>`
 display: grid; width: 44px; aspect-ratio: 1; flex-shrink: 0; place-items: center; justify-content: center; border: 1px solid var(--color-border); border-radius: 5px;
 background: ${({ $color }) => $color ?? "var(--color-main-neutral-light)"}; font-size: 14px; font-variant-numeric: tabular-nums;
`;
const Refresh = styled.button`
 display: inline-flex; min-width: fit-content; height: 32px; flex-shrink: 0; align-items: center; gap: 6px; padding: 0 10px;
 border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); font-size: 12px; cursor: pointer;
 &:hover:not(:disabled) { background: var(--color-main-neutral-light); }
 &:disabled { opacity: .4; cursor: default; }
`;
export function BrandAnalysisPanel({ brandId, revision, positiveCount, pendingWrite }: { brandId: string; revision: number; positiveCount: number; pendingWrite: boolean }) {
 const entry = useBrandAnalysisStore(state => state.entries[brandId]);
 const load = useBrandAnalysisStore(state => state.load);
 const run = useBrandAnalysisStore(state => state.run);
 const attempted = useRef("");
 useEffect(() => {
   if (pendingWrite) return;
   let active = true;
   void load(brandId).then(() => {
     if (!active || positiveCount < 20) return;
     const current = useBrandAnalysisStore.getState().entries[brandId];
     const stamp = `${brandId}:${revision}`;
     if (!current?.error && !current?.analysis?.result && ["not_started", "insufficient_data"].includes(current?.analysis?.status ?? "") && attempted.current !== stamp) {
       attempted.current = stamp; void run(brandId, "initial");
     }
   });
   const refresh = () => { void load(brandId); };
   window.addEventListener("focus", refresh);
   return () => { active = false; window.removeEventListener("focus", refresh); };
 }, [brandId, revision, positiveCount, pendingWrite, load, run]);
 const pending = analysisIsPending(entry?.analysis) || (entry?.loading && positiveCount >= 20);
 const result = entry?.analysis?.result;
 const error = entry?.error ?? entry?.analysis?.error ?? entry?.analysis?.reason ?? (entry?.analysis?.status === "failed" ? "브랜드 분석에 실패했습니다." : null);
 const refresh = <Refresh type="button" title={error ?? undefined} disabled={pending || pendingWrite || positiveCount < 20} onClick={() => void run(brandId, "manual")}><RefreshCw size={14} />분석 갱신</Refresh>;
 return <Panel aria-label="브랜드 분석" aria-busy={Boolean(pending)}>
   {pending ? <Placeholder role="status" aria-label="브랜드 분석 중"><Spinner size={28} strokeWidth={1.4} /></Placeholder> : result ? <>
     {result.description && <Description>{result.description}</Description>}
     <Palette aria-label="브랜드 스타일 컬러">
       {result.palette.map((color, index) => <Color key={`${color.hex}:${index}`} title={color.description ?? color.name}><Swatch $color={color.hex} /><strong>{color.name ?? `색상 ${index + 1}`}</strong><small>{color.hex.toUpperCase()}</small></Color>)}
       <Color><Swatch /><strong>채도</strong><small>{Math.round(analysisMeasure(result.saturation) * 100)}%</small></Color>
       <Color><Swatch $color={`rgb(${Math.round(analysisMeasure(result.brightness) * 255)} ${Math.round(analysisMeasure(result.brightness) * 255)} ${Math.round(analysisMeasure(result.brightness) * 255)})`} /><strong>명도</strong><small>{Math.round(analysisMeasure(result.brightness) * 100)}%</small></Color>
     </Palette>{refresh}
   </> : error ? <><Placeholder role="alert"><ChartNoAxesCombined size={28} /><p>{error}</p></Placeholder>{refresh}</> : <><Placeholder><ChartNoAxesCombined size={28} strokeWidth={1.4} aria-hidden="true" /><p>아직 충분한 자료가 모이지 않아 분석을 실행하지 않았습니다</p></Placeholder>{positiveCount >= 20 && refresh}</>}
 </Panel>;
}
