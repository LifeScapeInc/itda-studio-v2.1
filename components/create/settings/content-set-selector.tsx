"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { CONTENT_SET_OPTIONS } from "@/system/create/generation-options";
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

const CutCount = styled.span`
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);
  font-size: 11px;
  white-space: nowrap;
`;

const FreeCount = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2xs);
  padding-top: var(--space-2xs);

  input {
    width: 54px;
    height: 30px;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    text-align: center;
  }
`;

export function ContentSetSelector() {
  const selectedSet = useCreateStore((state) => state.contentSet);
  const freeCount = useCreateStore((state) => state.freeCount);
  const setContentSet = useCreateStore((state) => state.setContentSet);
  const setFreeCount = useCreateStore((state) => state.setFreeCount);

  return (
    <>
      <Description>
        사용 목적에 맞는 이미지 구성을 선택합니다
      </Description>
      <List role="radiogroup" aria-label="콘텐츠 세트">
        {CONTENT_SET_OPTIONS.map((option) => {
          const selected = selectedSet === option.id;
          const Icon = option.icon;
          return (
            <div key={option.id}>
              <GenerationOptionCard
                selected={selected}
                label={option.label}
                description={option.description}
                icon={<Icon size={13} />}
                trailing={(
                  <CutCount>
                    {option.cutCount ? `${option.cutCount}컷` : `${freeCount}컷`}
                  </CutCount>
                )}
                role="radio"
                ariaChecked={selected}
                onClick={() => setContentSet(option.id)}
              />
              {option.id === "free" && selected ? (
                <FreeCount>
                  <label
                    className="type-xsmall-thin"
                    htmlFor="free-cut-count"
                  >
                    생성 장 수
                  </label>
                  <input
                    id="free-cut-count"
                    type="number"
                    min={1}
                    value={freeCount}
                    onChange={(event) => (
                      setFreeCount(Number(event.target.value) || 1)
                    )}
                  />
                </FreeCount>
              ) : null}
            </div>
          );
        })}
      </List>
    </>
  );
}
