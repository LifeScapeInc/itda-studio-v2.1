"use client";

import { Check } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { CONTENT_SET_OPTIONS } from "@/system/create/generation-options";

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
  width: 100%;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
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
  text-align: left;
  cursor: pointer;
`;

const CheckBox = styled.span<{ $selected: boolean }>`
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid ${({ $selected }) => (
    $selected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 50%;
  background: ${({ $selected }) => ($selected ? "var(--color-main-primary)" : "transparent")};
  color: var(--color-surface);
`;

const OptionCopy = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  small { color: var(--color-label-studio-comment); }
`;

const OptionTitle = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  gap: var(--space-3xs);
`;


const CutCount = styled.span`
  padding: var(--space-3xs) var(--space-2xs);
  border-radius: 999px;
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
              <Option
                type="button"
                role="radio"
                aria-checked={selected}
                $selected={selected}
                onClick={() => setContentSet(option.id)}
              >
                <CheckBox $selected={selected}>
                  {selected ? <Check size={12} /> : null}
                </CheckBox>
                <OptionCopy>
                  <OptionTitle>
                    <Icon size={13} />
                    {option.label}
                  </OptionTitle>
                  <small>{option.description}</small>
                </OptionCopy>
                <CutCount>
                  {option.cutCount ? `${option.cutCount}컷` : `${freeCount}컷`}
                </CutCount>
              </Option>
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
