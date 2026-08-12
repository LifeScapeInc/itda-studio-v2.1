"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  buildGenerationPrompts,
  getGenerationModeLabel,
} from "@/system/create/generation-prompt";
import { PromptPreviewModal } from "./prompt-preview-modal";

const PreviewButton = styled.button`
  display: flex;
  height: 32px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-comment);
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    color: var(--color-label-studio-black);
    outline: none;
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 10%,
      transparent
    );
  }
`;

export function PromptPreview() {
  const [open, setOpen] = useState(false);
  const state = useCreateStore();
  const prompts = buildGenerationPrompts(state);

  return (
    <>
      <PreviewButton
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <FileText size={14} />
        최종 프롬프트
      </PreviewButton>
      {open ? (
        <PromptPreviewModal
          contentSetLabel={getGenerationModeLabel(
            state.contentSet,
            state.angleVariationIds,
          )}
          quality={state.quality}
          prompts={prompts}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
