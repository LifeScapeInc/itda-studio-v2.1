"use client";

import { Bookmark, CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import styled, { keyframes } from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import type { GenerationShot } from "@/system/create/generation-shots";
import { getRatioLabel } from "@/system/create/generation-shots";

const shimmer = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(220%); }
`;

const Card = styled.button`
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
  }
`;

const Preview = styled.div<{
  $ratio: string;
  $status: GenerationShot["status"];
  $selected: boolean;
}>`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio};
  place-items: center;
  border: 1px ${({ $status }) => (
    $status === "done" ? "solid" : "dashed"
  )} ${({ $status }) => (
    $status === "generating"
      ? "var(--color-main-primary)"
      : "var(--color-border)"
  )};
  border-radius: 8px;
  background: ${({ $status }) => (
    $status === "done"
      ? "linear-gradient(135deg, var(--color-main-neutral), var(--color-main-tertiary))"
      : "var(--color-main-neutral-light)"
  )};
  color: var(--color-main-secondary);
  outline: ${({ $selected }) => $selected
    ? "2px solid var(--color-main-primary)"
    : "none"};
  overflow: hidden;

  &::after {
    position: absolute;
    inset: 0 auto 0 0;
    display: ${({ $status }) => $status === "generating" ? "block" : "none"};
    width: 42%;
    background: linear-gradient(
      90deg,
      transparent,
      rgb(255 255 255 / 68%),
      transparent
    );
    content: "";
    animation: ${shimmer} 1.25s ease-in-out infinite;
  }
`;

const BookmarkBadge = styled.span`
  position: absolute;
  z-index: 3;
  top: var(--space-2xs);
  right: var(--space-2xs);
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-main-primary);
  box-shadow: 0 3px 12px rgb(32 29 23 / 16%);
`;

const Status = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-label-studio-comment);
  font-size: 12px;
`;

const Meta = styled.div`
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2xs);

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > span {
    flex: 0 0 auto;
    color: var(--color-label-studio-comment);
    font-size: 11px;
  }
`;

const ShotCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  span {
    color: var(--color-label-studio-comment);
    font-size: 10px;
  }
`;

function getAspectRatio(ratio: GenerationShot["ratio"]): string {
  const ratios: Record<GenerationShot["ratio"], string> = {
    "1:1": "1 / 1",
    "3:4": "3 / 4",
    "4:5": "4 / 5",
    "9:16": "9 / 16",
    "16:9": "16 / 9",
    original: "4 / 3",
  };

  return ratios[ratio];
}

function ShotStatus({
  status,
  error,
}: {
  status: GenerationShot["status"];
  error?: string;
}) {
  if (status === "generating") {
    return (
      <Status>
        <LoaderCircle size={24} className="animate-spin" />
        생성 중…
      </Status>
    );
  }

  if (status === "done") return null;

  if (status === "error") {
    return (
      <Status title={error}>
        <CircleAlert size={24} />
        생성 실패
      </Status>
    );
  }

  return (
    <Status>
      <Sparkles size={20} />
      대기 중
    </Status>
  );
}

export function GeneratedItem({
  shot,
  selected,
  onSelect,
  onOpenImage,
}: {
  shot: GenerationShot;
  selected: boolean;
  onSelect?: (shotId: string) => void;
  onOpenImage?: (shot: GenerationShot) => void;
}) {
  return (
    <Card
      type="button"
      disabled={shot.status !== "done"}
      aria-pressed={selected}
      aria-label={`${shot.label}${shot.status === "done" ? " 선택" : ""}`}
      onClick={() => onSelect?.(shot.id)}
      onDoubleClick={() => {
        if (shot.status === "done" && shot.imageUrl) onOpenImage?.(shot);
      }}
    >
      <Preview
        $ratio={getAspectRatio(shot.ratio)}
        $selected={selected}
        $status={shot.status}
      >
        {shot.status === "done" && shot.imageUrl ? (
          <LoadingImage
            src={shot.imageUrl}
            alt={`${shot.label} 생성 결과`}
            fill
            unoptimized
            sizes="(max-width: 900px) 50vw, 240px"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <ShotStatus status={shot.status} error={shot.error} />
        )}
        {"bookmarked" in shot && shot.bookmarked ? (
          <BookmarkBadge title="북마크됨">
            <Bookmark size={15} fill="currentColor" />
          </BookmarkBadge>
        ) : null}
      </Preview>
      <Meta>
        <ShotCopy>
          <strong className="type-xsmall-thin">{shot.label}</strong>
          <span>{shot.resolution}</span>
        </ShotCopy>
        <span>{getRatioLabel(shot.ratio)}</span>
      </Meta>
    </Card>
  );
}
