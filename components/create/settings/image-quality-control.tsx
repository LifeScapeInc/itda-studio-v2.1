"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { QUALITY_OPTIONS } from "@/system/create/generation-options";

const Card = styled.section`
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
`;

const Heading = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;

  span {
    color: var(--color-label-studio-comment);
    font-size: 10px;
    font-weight: 400;
  }
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 9px 8px;
  border: 1px solid ${({ $selected }) => $selected ? "var(--color-main-primary)" : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $selected }) => $selected ? "color-mix(in srgb, var(--color-main-primary) 8%, var(--color-surface))" : "var(--color-surface)"};
  color: var(--color-label-studio-black);
  text-align: left;
  cursor: pointer;

  strong { font-size: 11px; }
  span { color: var(--color-label-studio-comment); font-size: 10px; }
  small { color: var(--color-main-primary); font-size: 10px; }
  &:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 2px; }
`;

const Note = styled.p`
  margin: 9px 0 0;
  color: var(--color-label-studio-comment);
  font-size: 10px;
  line-height: 1.45;
`;

export function ImageQualityControl() {
  const quality = useCreateStore(state => state.quality);
  const setQuality = useCreateStore(state => state.setQuality);

  return (
    <Card aria-label="이미지 품질">
      <Heading>이미지 품질 <span>GPT Image 2</span></Heading>
      <Options role="group" aria-label="이미지 품질 선택">
        {QUALITY_OPTIONS.map(option => (
          <Option
            key={option.id}
            type="button"
            $selected={quality === option.id}
            aria-pressed={quality === option.id}
            onClick={() => setQuality(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
            <small>약 ${option.squareOutputUsd.toFixed(3)}/장</small>
          </Option>
        ))}
      </Options>
      <Note>표시 금액은 1:1(1024×1024) 이미지 출력분 예시입니다. 실제 비용은 비율과 입력 텍스트·참조 이미지에 따라 달라집니다.</Note>
    </Card>
  );
}
