"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import {
  buildGenerationPrompts,
} from "@/system/create/generation-prompt";
import { PromptPreviewModal } from "./prompt-preview-modal";
import { getBatchLabel } from "@/system/create/generation-batch";

const PreviewButton = styled.button`
  display: flex;
  height: 28px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-xs);
  border: 0;
  border-radius: 4px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-comment);
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
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
          contentSetLabel={getBatchLabel(state.batchEntries)}
          quality={state.quality}
          prompts={prompts}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
