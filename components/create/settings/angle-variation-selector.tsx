"use client";

import { Check } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { ANGLE_VARIATION_OPTIONS } from "@/system/create/generation-options";

const Description = styled.p`
  margin-bottom: var(--space-xs);
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1.45;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
`;

const Option = styled.button<{ $selected: boolean }>`
  display: grid;
  width: 100%;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs);
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 8px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-neutral)" : "var(--color-surface)"
  )};
  color: var(--color-label-studio-black);
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
  }
`;

const CheckBox = styled.span<{ $selected: boolean }>`
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 5px;
  background: ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "transparent"
  )};
  color: var(--color-surface);
`;

export function AngleVariationSelector({
  onActivate,
}: {
  onActivate: () => void;
}) {
  const selectedIds = useCreateStore((state) => state.angleVariationIds);
  const toggleAngleVariation = useCreateStore(
    (state) => state.toggleAngleVariation,
  );

  return (
    <>
      <Description>
        카메라 위치와 촬영 기법만 바꿔 생성합니다
      </Description>
      <List aria-label="앵글 변주" aria-multiselectable="true">
        {ANGLE_VARIATION_OPTIONS.map((option) => {
          const selected = selectedIds.includes(option.id);

          return (
            <Option
              type="button"
              $selected={selected}
              aria-pressed={selected}
              onClick={() => {
                if (!selected) {
                  onActivate();
                }
                toggleAngleVariation(option.id);
              }}
              key={option.id}
            >
              <CheckBox $selected={selected}>
                {selected ? <Check size={12} /> : null}
              </CheckBox>
              <span className="type-xsmall-thin">{option.label}</span>
            </Option>
          );
        })}
      </List>
    </>
  );
}
