"use client";

import { useId } from "react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  h3 { font-size: 12px; font-weight: 700; }
  p { font-size: 10px; line-height: 1.6; color: var(--color-label-studio-comment); }
`;
const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  strong { color: var(--color-main-primary); font-variant-numeric: tabular-nums; }
`;
const Slider = styled.input`
  display: block;
  width: 100%;
  height: 24px;
  margin: 5px 0;
  accent-color: var(--color-main-primary);
  cursor: pointer;
`;
const Scale = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-label-studio-comment);
`;

export function ReferenceStrengthControl() {
  const id = useId();
  const reference = useCreateStore(state => state.referenceImage);
  const preservation = useCreateStore(state => state.productPreservation);
  const strength = useCreateStore(state => state.referenceStrength);
  const setPreservation = useCreateStore(state => state.setProductPreservation);
  const setStrength = useCreateStore(state => state.setReferenceStrength);
  if (!reference) return null;

  return (
    <Card aria-label="이미지 참조 설정">
      <h3>이미지 참조 설정</h3>
      <div>
        <Heading><label htmlFor={`${id}-product`}>내 제품 유지 강도</label><strong>{preservation}</strong></Heading>
        <Slider id={`${id}-product`} type="range" min={0} max={100} step={5} value={preservation}
          aria-valuetext={`${preservation}, ${preservation >= 75 ? "형태·색상·소재 유지" : preservation >= 35 ? "형태 유지, 소재와 색감 조정" : "소재와 스타일을 자유롭게 변형"}`}
          onChange={event => setPreservation(Number(event.target.value))} />
        <Scale><span>자유롭게 변형</span><span>원형 충실히 유지</span></Scale>
      </div>
      <div>
        <Heading><label htmlFor={`${id}-reference`}>레퍼런스 반영 강도</label><strong>{strength}</strong></Heading>
        <Slider id={`${id}-reference`} type="range" min={0} max={100} step={5} value={strength}
          aria-valuetext={`${strength}, ${strength === 0 ? "레퍼런스 사용 안 함" : strength < 35 ? "분위기만 참고" : strength < 75 ? "조명·색감·스타일 참고" : "공간과 배치까지 반영"}`}
          onChange={event => setStrength(Number(event.target.value))} />
        <Scale><span>분위기만 참고</span><span>공간·배치까지 반영</span></Scale>
      </div>
      <p>강도는 AI에게 전달할 연출 방향입니다. 정확한 복제 비율을 뜻하지 않으며, 제품 유지 강도가 낮으면 색상·소재가 달라질 수 있어요.</p>
    </Card>
  );
}
