"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  LIGHT_OPTIONS,
  MOOD_OPTIONS,
  PROP_OPTIONS,
} from "@/system/create/generation-options";

const Description = styled.p`
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1.45;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
`;

const FieldLabel = styled.span`
  color: var(--color-label-studio-comment);
  font-size: 11px;
  font-weight: 700;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
`;

const Chip = styled.button<{ $selected: boolean }>`
  height: 30px;
  padding: 0 var(--space-xs);
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 999px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-surface)"
  )};
  color: ${({ $selected }) => ($selected ? "var(--color-surface)" : "inherit")};
  font-size: 11px;
  cursor: pointer;
`;

function ChipGroup({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
  multi?: boolean;
}) {
  return (
    <Chips role="group" aria-label={multi ? "복수 선택 가능" : "한 가지 선택"}>
      {options.map((option) => (
        <Chip
          type="button"
          $selected={selected.includes(option)}
          aria-pressed={selected.includes(option)}
          onClick={() => onSelect(option)}
          key={option}
        >
          {option}
        </Chip>
      ))}
    </Chips>
  );
}

export function ExpertSettings() {
  const light = useCreateStore((state) => state.light);
  const mood = useCreateStore((state) => state.mood);
  const props = useCreateStore((state) => state.props);
  const setLight = useCreateStore((state) => state.setLight);
  const setMood = useCreateStore((state) => state.setMood);
  const toggleProp = useCreateStore((state) => state.toggleProp);

  return (
    <Fields>
      <Description>
        선택한 생성 방식에 공통 적용됩니다. ‘원본 유지’는 별도 지시를 넣지 않는다는 뜻이며, 레퍼런스의 영향은 남을 수 있어요.
      </Description>
      <Field><FieldLabel>채광 및 시간대</FieldLabel><ChipGroup options={LIGHT_OPTIONS} selected={[light]} onSelect={setLight} /></Field>
      <Field><FieldLabel>인테리어 무드</FieldLabel><ChipGroup options={MOOD_OPTIONS} selected={[mood]} onSelect={setMood} /></Field>
      <Field><FieldLabel>연출 소품</FieldLabel><ChipGroup options={PROP_OPTIONS} selected={props} onSelect={toggleProp} multi /></Field>
      <Description>소품은 여러 개 선택할 수 있습니다. ‘소품 없음’은 다른 소품 선택을 해제합니다.</Description>
    </Fields>
  );
}
