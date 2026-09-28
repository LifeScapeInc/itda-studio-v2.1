"use client";

import { useId } from "react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { getRatioOption, IMAGE_RATIO_OPTIONS } from "@/system/create/generation-ratios";

const Card = styled.section`
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
`;
const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 700;
  span { color: var(--color-label-studio-comment); font-size: 10px; font-weight: 400; }
`;
const Layout = styled.div`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
`;
const PreviewArea = styled.div`
  height: 90px;
  display: grid;
  place-items: center;
`;
const Preview = styled.div<{ $width: number; $height: number }>`
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  display: grid;
  place-items: center;
  border: 1.5px solid var(--color-main-primary);
  border-radius: 8px;
  color: var(--color-main-primary);
  background: color-mix(in srgb, var(--color-main-primary) 5%, var(--color-surface));
  transition: width 160ms, height 160ms;
  font-size: 12px;
  font-weight: 700;
`;
const Segments = styled.div`
  display: flex;
  padding: 3px;
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  button {
    flex: 1;
    padding: 6px 2px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-size: 11px;
    color: var(--color-label-studio-comment);
    cursor: pointer;
  }
  button[aria-pressed="true"] { background: var(--color-surface); color: var(--color-main-primary); font-weight: 700; }
  button:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 2px; }
`;
const Slider = styled.input`
  display: block;
  width: 100%;
  height: 22px;
  margin: 12px 0 4px;
  accent-color: var(--color-main-primary);
  cursor: pointer;
`;
const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--color-label-studio-comment);
  font-size: 9px;
`;
const PresetToggle = styled.label`
  display: flex;
  gap: 7px;
  align-items: center;
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-label-studio-comment);
  input { accent-color: var(--color-main-primary); }
`;

export function ImageRatioControl() {
  const id = useId();
  const ratio = useCreateStore(state => state.aspectRatio);
  const useSetRatios = useCreateStore(state => state.useSetRatios);
  const contentSet = useCreateStore(state => state.contentSet);
  const angleCount = useCreateStore(state => state.angleVariationIds.length);
  const setAspectRatio = useCreateStore(state => state.setAspectRatio);
  const setUseSetRatios = useCreateStore(state => state.setUseSetRatios);
  const option = getRatioOption(ratio);
  const selectedIndex = IMAGE_RATIO_OPTIONS.findIndex(item => item.ratio === ratio);
  const scale = 76 / Math.max(option.width, option.height);
  const hasPreset = Boolean(contentSet && contentSet !== "free" && angleCount === 0);
  const presetActive = hasPreset && useSetRatios;

  return (
    <Card aria-labelledby={`${id}-label`}>
      <Heading>
        <label id={`${id}-label`} htmlFor={`${id}-range`}>이미지 비율</label>
        <span>{presetActive ? "세트별 권장 비율" : `${option.width} × ${option.height}`}</span>
      </Heading>
      <Layout>
        <PreviewArea>
          <Preview $width={option.width * scale} $height={option.height * scale} aria-hidden="true">{ratio}</Preview>
        </PreviewArea>
        <div>
          <Segments aria-label="이미지 방향">
            <button type="button" aria-pressed={!presetActive && selectedIndex < 4} onClick={() => setAspectRatio("3:4")}>세로</button>
            <button type="button" aria-pressed={!presetActive && selectedIndex === 4} onClick={() => setAspectRatio("1:1")}>정사각형</button>
            <button type="button" aria-pressed={!presetActive && selectedIndex > 4} onClick={() => setAspectRatio("4:3")}>가로</button>
          </Segments>
          <Slider id={`${id}-range`} type="range" min={0} max={IMAGE_RATIO_OPTIONS.length - 1} step={1}
            value={selectedIndex} aria-valuetext={`${ratio}${presetActive ? ", 현재 세트별 권장 비율 사용 중" : ""}`}
            onChange={event => setAspectRatio(IMAGE_RATIO_OPTIONS[Number(event.target.value)].ratio)} />
          <Labels aria-hidden="true"><span>9:16</span><span>1:1</span><span>16:9</span></Labels>
        </div>
      </Layout>
      {hasPreset ? <PresetToggle><input type="checkbox" checked={useSetRatios} onChange={event => setUseSetRatios(event.target.checked)} />세트별 권장 비율 사용</PresetToggle> : null}
    </Card>
  );
}
