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
  color: var(--color-label-studio-black);
  font-size: 13px;
  font-weight: 500;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
`;

const Chip = styled.button<{ $selected: boolean }>`
  height: 28px;
  padding: 0 var(--space-xs);
  border: 0;
  border-radius: 4px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-neutral)" : "transparent"
  )};
  color: ${({ $selected }) => ($selected ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)")};
  font-size: 12px;
  cursor: pointer;
`;

const Select = styled.select`
  height: 28px;
  padding: 0 var(--space-2xs);
  border: 0;
  border-radius: 4px;
  background: var(--color-surface);
  font-size: 12px;
  outline: none;

  &:hover { background: var(--color-main-neutral-light); }
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
  const setQuality = useCreateStore((state) => state.setQuality);
  const setEditMode = useCreateStore((state) => state.setEditMode);
  const setLight = useCreateStore((state) => state.setLight);
  const setMood = useCreateStore((state) => state.setMood);
  const toggleProp = useCreateStore((state) => state.toggleProp);

  return (
    <Fields>
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
    </Fields>
  );
}
