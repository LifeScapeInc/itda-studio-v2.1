"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { ANGLE_VARIATION_OPTIONS } from "@/system/create/generation-options";
import { GenerationOptionCard } from "./generation-option-card";

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
            <GenerationOptionCard
              selected={selected}
              label={option.label}
              description={option.description}
              previewImage={option.previewImage}
              ariaPressed={selected}
              onClick={() => {
                if (!selected) {
                  onActivate();
                }
                toggleAngleVariation(option.id);
              }}
              key={option.id}
            />
          );
        })}
      </List>
    </>
  );
}
