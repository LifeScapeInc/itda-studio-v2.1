"use client";
import { Plus } from "lucide-react";
import styled from "styled-components";
const Button = styled.button`
 position: absolute; z-index: 2; right: 28px; bottom: 28px; display: inline-flex; height: 36px; align-items: center; gap: 8px; padding: 0 16px;
 border: 0; border-radius: var(--radius-panel); background: var(--color-main-primary); color: var(--color-surface); font-size: 13px; font-weight: 500; cursor: pointer;
 &:hover:not(:disabled) { background: var(--color-main-secondary); }
 &:disabled { opacity: .5; cursor: default; }
`;
export function ButtonAdd({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
 return <Button type="button" disabled={disabled} onClick={onClick} aria-label="새 프로젝트 추가"><Plus size={16} />프로젝트 추가</Button>;
}
