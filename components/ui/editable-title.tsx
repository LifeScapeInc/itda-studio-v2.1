"use client";

import { useState } from "react";
import styled from "styled-components";

const Label = styled.button`
  min-width: 0; max-width: 100%; height: var(--editable-title-height, 28px); padding: 0 4px;
  border: 1px solid transparent; border-radius: 4px; background: transparent;
  color: inherit; font: inherit; text-align: inherit; cursor: text;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  &:hover { background: var(--color-main-neutral); }
`;
const Input = styled.input`
  width: 100%; min-width: 0; height: var(--editable-title-height, 28px); padding: 0 4px;
  border: 1px solid var(--color-main-primary); border-radius: 4px; background: var(--color-surface);
  color: inherit; font: inherit; text-align: inherit;
  &::selection { background: var(--color-main-primary); color: var(--color-surface); }
`;

export function EditableTitle({ value, onSave, label }: { value: string; onSave: (value: string) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { const next = draft.trim(); if (next && next !== value) onSave(next); setEditing(false); };
  return editing ? <Input autoFocus aria-label={label} value={draft} maxLength={120}
    onFocus={event => event.currentTarget.select()} onChange={event => setDraft(event.target.value)}
    onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
    onBlur={commit} onKeyDown={event => {
      event.stopPropagation();
      if (event.key === "Enter") { event.preventDefault(); commit(); }
      if (event.key === "Escape") { event.preventDefault(); setEditing(false); }
    }} /> : <Label type="button" aria-label={`${label} 수정`} title={value}
      onClick={event => { event.stopPropagation(); setDraft(value); setEditing(true); }}
      onDoubleClick={event => event.stopPropagation()}>{value}</Label>;
}
