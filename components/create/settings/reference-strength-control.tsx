"use client";

import { useId } from "react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  PRODUCT_PRESERVATION_STEPS,
  REFERENCE_ROLE_OPTIONS,
  REFERENCE_STRENGTH_STEPS,
} from "@/system/create/reference-controls";

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
const RoleChoices = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  button {
    min-height: 38px;
    padding: 5px 3px;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    background: var(--color-surface);
    color: var(--color-label-studio-comment);
    font-size: 10px;
    cursor: pointer;
  }
  button[aria-pressed="true"] {
    border-color: var(--color-main-primary);
    color: var(--color-main-primary);
    font-weight: 700;
  }
`;

export function ReferenceStrengthControl() {
  const id = useId();
  const reference = useCreateStore(state => state.referenceImage);
  const preservation = useCreateStore(state => state.productPreservation);
  const strength = useCreateStore(state => state.referenceStrength);
  const referenceRole = useCreateStore(state => state.referenceRole);
  const setPreservation = useCreateStore(state => state.setProductPreservation);
  const setStrength = useCreateStore(state => state.setReferenceStrength);
  const setReferenceRole = useCreateStore(state => state.setReferenceRole);
  const preservationIndex = Math.max(0, PRODUCT_PRESERVATION_STEPS.findIndex(step => step.value === preservation));
  const strengthIndex = Math.max(0, REFERENCE_STRENGTH_STEPS.findIndex(step => step.value === strength));
  if (!reference) return null;

  return (
    <Card aria-label="이미지 참조 설정">
      <h3>이미지 참조 설정</h3>
      <div>
        <Heading>두 번째 사진의 역할</Heading>
        <RoleChoices role="group" aria-label="두 번째 사진의 역할">
          {REFERENCE_ROLE_OPTIONS.map(option => (
            <button key={option.id} type="button" aria-pressed={referenceRole === option.id}
              title={option.description} onClick={() => setReferenceRole(option.id)}>{option.label}</button>
          ))}
        </RoleChoices>
      </div>
      <div>
        <Heading><label htmlFor={`${id}-product`}>내 제품 유지</label><strong>{PRODUCT_PRESERVATION_STEPS[preservationIndex].label}</strong></Heading>
        <Slider id={`${id}-product`} type="range" min={0} max={PRODUCT_PRESERVATION_STEPS.length - 1} step={1} value={preservationIndex}
          aria-valuetext={PRODUCT_PRESERVATION_STEPS[preservationIndex].description}
          onChange={event => setPreservation(PRODUCT_PRESERVATION_STEPS[Number(event.target.value)].value)} />
        <Scale><span>창의적 변형</span><span>원형 충실</span></Scale>
      </div>
      <div>
        <Heading><label htmlFor={`${id}-reference`}>레퍼런스 반영</label><strong>{REFERENCE_STRENGTH_STEPS[strengthIndex].label}</strong></Heading>
        <Slider id={`${id}-reference`} type="range" min={0} max={REFERENCE_STRENGTH_STEPS.length - 1} step={1} value={strengthIndex}
          aria-valuetext={REFERENCE_STRENGTH_STEPS[strengthIndex].description}
          onChange={event => setStrength(REFERENCE_STRENGTH_STEPS[Number(event.target.value)].value)} />
        <Scale><span>사용 안 함</span><span>강하게</span></Scale>
      </div>
      <p>각 눈금은 서로 다른 프롬프트 단계입니다. 정확한 복제율은 아니며, ‘사용 안 함’에서는 두 번째 사진을 API에 보내지 않습니다.</p>
    </Card>
  );
}
