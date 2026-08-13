"use client";

import Image from "next/image";
import styled from "styled-components";
import type { GenerationHistorySet } from "@/system/create/generation-library";

const Card = styled.button<{ $active: boolean }>`
  display: flex;
  width: 176px;
  height: 112px;
  flex: 0 0 176px;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $active }) => $active
    ? "var(--color-main-neutral-light)"
    : "var(--color-surface)"};
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 2px;
  }
`;

const Preview = styled.span`
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
`;

const PreviewImage = styled.span`
  position: relative;
  min-width: 0;
  border-radius: 5px;
  background: var(--color-main-neutral);
  overflow: hidden;

  img {
    object-fit: cover;
  }
`;

const Copy = styled.span`
  display: flex;
  min-width: 0;
  justify-content: space-between;
  gap: 4px;
  font-size: 10px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  time {
    flex: 0 0 auto;
    color: var(--color-label-studio-comment);
  }
`;

export function ItemHistory({
  historySet,
  active,
  onSelect,
}: {
  historySet: GenerationHistorySet;
  active: boolean;
  onSelect: () => void;
}) {
  const previewShots = historySet.shots
    .filter((shot) => shot.imageUrl)
    .slice(0, 3);

  return (
    <Card
      type="button"
      $active={active}
      aria-pressed={active}
      aria-label={`${historySet.title} 이미지셋 복원`}
      onClick={onSelect}
    >
      <Preview>
        {previewShots.length ? previewShots.map((shot) => (
          <PreviewImage key={shot.id}>
            <Image
              src={shot.imageUrl!}
              alt=""
              fill
              unoptimized
              sizes="54px"
            />
          </PreviewImage>
        )) : <PreviewImage />}
      </Preview>
      <Copy>
        <strong>{historySet.title}</strong>
        <time>
          {new Date(historySet.createdAt).toLocaleDateString(
            "ko-KR",
            { month: "numeric", day: "numeric" },
          )}
        </time>
      </Copy>
    </Card>
  );
}
