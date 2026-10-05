"use client";

import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { CONTENT_SET_OPTIONS, MAX_GENERATION_COUNT } from "@/system/create/generation-options";
import { GenerationOptionCard } from "./generation-option-card";

const Description = styled.p`
  margin-bottom: var(--space-xs);
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1.45;
`;

const List = styled.div<{ $grid: boolean }>`
  display: ${({ $grid }) => $grid ? "grid" : "flex"};
  grid-template-columns: ${({ $grid }) => $grid ? "repeat(2, minmax(0, 1fr))" : "none"};
  flex-direction: column;
  gap: var(--space-2xs);

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Choice = styled.div<{ $featured: boolean; $grid: boolean }>`
  grid-column: ${({ $featured, $grid }) => $featured && $grid ? "1 / -1" : "auto"};
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

const CountChoices = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 8px;
  button {
    flex: 1;
    height: 30px;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    background: var(--color-surface);
    font-size: 11px;
    cursor: pointer;
  }
  button[aria-pressed="true"] {
    color: var(--color-main-primary);
    border-color: var(--color-main-primary);
    background: color-mix(in srgb, var(--color-main-primary) 6%, var(--color-surface));
  }
`;

export function ContentSetSelector({ layout = "list" }: { layout?: "list" | "grid" }) {
  const selectedSet = useCreateStore((state) => state.contentSet);
  const freeCount = useCreateStore((state) => state.freeCount);
  const setContentSet = useCreateStore((state) => state.setContentSet);
  const setFreeCount = useCreateStore((state) => state.setFreeCount);

  return (
    <>
      <Description>
        앵글 변주와 둘 중 하나만 선택합니다. 다시 누르면 해제됩니다.
      </Description>
      <List role="group" aria-label="콘텐츠 세트" $grid={layout === "grid"}>
        {[...CONTENT_SET_OPTIONS].sort((a, b) => Number(b.id === "free") - Number(a.id === "free")).map((option) => {
          const selected = selectedSet === option.id;
          const Icon = option.icon;
          return (
            <Choice key={option.id} $featured={option.id === "free"} $grid={layout === "grid"}>
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
                ariaPressed={selected}
                onClick={() => setContentSet(option.id)}
              />
              {option.id === "free" && selected ? (
                <>
                <CountChoices role="group" aria-label="생성 장 수 빠른 선택">
                  {[1, 2, 4, 8].map(count => (
                    <button type="button" key={count} aria-pressed={freeCount === count} onClick={() => setFreeCount(count)}>{count}장</button>
                  ))}
                </CountChoices>
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
                    max={MAX_GENERATION_COUNT}
                    step={1}
                    value={freeCount}
                    onChange={(event) => (
                      setFreeCount(Number(event.target.value) || 1)
                    )}
                  />
                </FreeCount>
                <Description style={{ marginTop: 6, marginBottom: 0 }}>최대 4장씩 동시에 생성합니다. 장 수에 따라 사용량이 늘어납니다.</Description>
                </>
              ) : null}
            </Choice>
          );
        })}
      </List>
    </>
  );
}
