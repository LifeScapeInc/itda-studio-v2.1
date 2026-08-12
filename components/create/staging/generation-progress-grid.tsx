"use client";

import Image from "next/image";
import { CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import styled, { keyframes } from "styled-components";
import type { GenerationShot } from "@/system/create/generation-shots";
import { getRatioLabel } from "@/system/create/generation-shots";

const shimmer = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(220%); }
`;

const Scroll = styled.div`
  width: 100%;
  height: 100%;
  padding: var(--space-lg);
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Grid = styled.div`
  display: grid;
  width: min(100%, 940px);
  margin: 0 auto;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-items: start;
  gap: var(--space-sm);
`;

const Card = styled.article`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2xs);
`;

const Preview = styled.div<{ $ratio: string; $status: GenerationShot["status"] }>`
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
  border-radius: 12px;
  background: ${({ $status }) => (
    $status === "done"
      ? "linear-gradient(135deg, var(--color-main-neutral), var(--color-main-tertiary))"
      : "var(--color-main-neutral-light)"
  )};
  color: var(--color-main-secondary);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    display: ${({ $status }) => ($status === "generating" ? "block" : "none")};
    width: 42%;
    background: linear-gradient(
      90deg,
      transparent,
      rgb(255 255 255 / 68%),
      transparent
    );
    animation: ${shimmer} 1.25s ease-in-out infinite;
  }
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

const ResultImage = styled(Image)`
  object-fit: contain;
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

  if (status === "done") {
    return null;
  }

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

export function GenerationProgressGrid({
  shots,
}: {
  shots: GenerationShot[];
}) {
  return (
    <Scroll>
      <Grid>
        {shots.map((shot) => (
          <Card key={shot.id}>
            <Preview
              $ratio={getAspectRatio(shot.ratio)}
              $status={shot.status}
            >
              {shot.status === "done" && shot.imageUrl ? (
                <ResultImage
                  src={shot.imageUrl}
                  alt={`${shot.label} 생성 결과`}
                  fill
                  unoptimized
                  sizes="(max-width: 900px) 50vw, 240px"
                />
              ) : (
                <ShotStatus status={shot.status} error={shot.error} />
              )}
            </Preview>
            <Meta>
              <ShotCopy>
                <strong className="type-xsmall-thin">{shot.label}</strong>
                <span>{shot.resolution}</span>
              </ShotCopy>
              <span>{getRatioLabel(shot.ratio)}</span>
            </Meta>
          </Card>
        ))}
      </Grid>
    </Scroll>
  );
}
