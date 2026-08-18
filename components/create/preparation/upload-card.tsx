"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { X } from "lucide-react";
import styled from "styled-components";

const Root = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const Preview = styled.label<{ $hasValue: boolean }>`
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  flex: 0 0 auto;
  place-items: center;
  border: ${({ $hasValue }) => ($hasValue ? "1px solid" : "2px dashed")}
    var(--color-border);
  border-radius: 12px;
  background: var(--color-main-neutral-light);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    background 200ms ease,
    box-shadow 200ms ease,
    transform 200ms ease;

  img {
    object-fit: cover;
  }

  &:hover {
    border-color: var(--color-main-primary);
    background: color-mix(
      in srgb,
      var(--color-main-primary) 8%,
      var(--color-surface)
    );
    box-shadow: 0 8px 20px rgb(32 29 23 / 8%);
    transform: translateY(-1px);
  }

  &:focus-within {
    border-color: var(--color-main-primary);
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 14%,
      transparent
    );
  }
`;

const EmptyCopy = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-label-studio-comment);
  font-size: 12px;
  text-align: center;

  svg {
    transition:
      color 200ms ease,
      transform 200ms ease;
  }

  ${Preview}:hover & {
    color: var(--color-label-studio-black);
  }

  ${Preview}:hover & svg {
    color: var(--color-main-primary);
    transform: scale(1.08);
  }
`;

const Remove = styled.button`
  position: absolute;
  z-index: 2;
  top: var(--space-2xs);
  right: var(--space-2xs);
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(32 29 23 / 70%);
  color: var(--color-surface);
  cursor: pointer;
  transition: background 160ms ease;

  &:hover {
    background: var(--color-label-studio-black);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

export function UploadCard({
  hasValue,
  icon,
  label,
  description,
  accept,
  children,
  removeLabel,
  onFile,
  onRemove,
  onPreviewClick,
}: {
  hasValue: boolean;
  icon: ReactNode;
  label: string;
  description?: string;
  accept?: string;
  children?: ReactNode;
  removeLabel: string;
  onFile?: (file: File) => void | Promise<void>;
  onRemove: () => void;
  onPreviewClick?: () => void;
}) {
  const openAlternateSource = (
    event: MouseEvent<HTMLLabelElement> | KeyboardEvent<HTMLLabelElement>,
  ) => {
    if (!onPreviewClick) return;
    event.preventDefault();
    onPreviewClick();
  };

  return (
    <Root>
      <Preview
        $hasValue={hasValue}
        tabIndex={onPreviewClick ? 0 : undefined}
        role={onPreviewClick ? "button" : undefined}
        onClick={openAlternateSource}
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            openAlternateSource(event);
          }
        }}
      >
        {children ?? (
          <EmptyCopy>
            {icon}
            <span className="type-xsmall-body">{label}</span>
            {description ? (
              <span className="type-xsmall-thin">{description}</span>
            ) : null}
          </EmptyCopy>
        )}
        {onFile ? (
          <HiddenInput
            type="file"
            accept={accept}
            aria-label={label}
            onChange={async event => {
              const file = event.target.files?.[0];
              if (file) await onFile(file);
              event.target.value = "";
            }}
          />
        ) : null}
        {hasValue ? (
          <Remove
            type="button"
            aria-label={removeLabel}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} />
          </Remove>
        ) : null}
      </Preview>
    </Root>
  );
}
