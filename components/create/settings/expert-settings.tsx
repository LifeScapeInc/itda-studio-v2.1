"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  EDIT_MODE_OPTIONS,
  LIGHT_OPTIONS,
  MOOD_OPTIONS,
  PROP_OPTIONS,
  QUALITY_OPTIONS,
  type GenerationQuality,
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

const Select = styled.select`
  height: 34px;
  padding: 0 var(--space-2xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 12px;
  outline: none;

  &:focus { border-color: var(--color-main-primary); }
`;

const Prompt = styled.textarea`
  width: 100%;
  height: 78px;
  resize: none;
  padding: var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  font-size: 12px;
  line-height: 1.5;
  outline: none;

  &:focus { border-color: var(--color-main-primary); }
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
    <Chips aria-multiselectable={multi}>
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
  const referenceImage = useCreateStore((state) => state.referenceImage);
  const quality = useCreateStore((state) => state.quality);
  const editMode = useCreateStore((state) => state.editMode);
  const light = useCreateStore((state) => state.light);
  const mood = useCreateStore((state) => state.mood);
  const props = useCreateStore((state) => state.props);
  const prompt = useCreateStore((state) => state.prompt);
  const setQuality = useCreateStore((state) => state.setQuality);
  const setEditMode = useCreateStore((state) => state.setEditMode);
  const setLight = useCreateStore((state) => state.setLight);
  const setMood = useCreateStore((state) => state.setMood);
  const toggleProp = useCreateStore((state) => state.toggleProp);
  const setPrompt = useCreateStore((state) => state.setPrompt);

  return (
    <Fields>
      <Description>
        품질과 조명, 무드 등 세부 생성 조건을 설정합니다
      </Description>
      <Field>
        <FieldLabel>품질</FieldLabel>
        <Chips>
          {QUALITY_OPTIONS.map((option) => (
            <Chip
              type="button"
              $selected={quality === option.id}
              onClick={() => setQuality(option.id as GenerationQuality)}
              key={option.id}
            >
              {option.label}
            </Chip>
          ))}
        </Chips>
      </Field>
      {referenceImage ? (
        <Field>
          <FieldLabel>AI 편집 방식</FieldLabel>
          <Select
            value={editMode}
            onChange={(event) => setEditMode(event.target.value)}
          >
            {EDIT_MODE_OPTIONS.map((option) => (
              <option
                value={option.id}
                key={option.id}
              >
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field><FieldLabel>채광 및 시간대</FieldLabel><ChipGroup options={LIGHT_OPTIONS} selected={[light]} onSelect={setLight} /></Field>
      <Field><FieldLabel>인테리어 무드</FieldLabel><ChipGroup options={MOOD_OPTIONS} selected={[mood]} onSelect={setMood} /></Field>
      <Field><FieldLabel>연출 소품</FieldLabel><ChipGroup options={PROP_OPTIONS} selected={props} onSelect={toggleProp} multi /></Field>
      <Field>
        <FieldLabel>추가 디렉션 (프롬프트)</FieldLabel>
        <Prompt
          value={prompt}
          placeholder={'예) \'조명을 더 밝게\', \'바닥을 우드톤으로\''}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </Field>
    </Fields>
  );
}
