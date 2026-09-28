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

export function AngleVariationSelector() {
  const selectedIds = useCreateStore((state) => state.angleVariationIds);
  const toggleAngleVariation = useCreateStore(
    (state) => state.toggleAngleVariation,
  );

  return (
    <>
      <Description>
        같은 공간을 다른 시점으로 촬영합니다. 전문가 설정의 채광·소품도 함께 적용할 수 있어요.
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
              onClick={() => toggleAngleVariation(option.id)}
              key={option.id}
            />
          );
        })}
      </List>
    </>
  );
}
