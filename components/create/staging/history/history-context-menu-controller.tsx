"use client";

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { ContextMenu } from "@/components/ui/context-menu";
import { useMenuTargetSelection } from "@/components/ui/use-menu-target-selection";
import { useCreateStore } from "@/stores/useCreateStore";
import { downloadGenerationSet } from "@/system/create/download-images";
import type { GenerationHistorySet } from "@/system/create/generation-library";

export type HistoryContextMenuHandle = { open: (id: string, x: number, y: number) => void };

export const HistoryContextMenuController = forwardRef<HistoryContextMenuHandle, {
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  deleteDisabled?: boolean;
}>(function HistoryContextMenuController({ onRestore, onDelete, deleteDisabled }, ref) {
  const [context, setContext] = useState<{ id: string; x: number; y: number } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const close = useCallback(() => setContext(null), []);
  useImperativeHandle(ref, () => ({ open: (id, x, y) => setContext({ id, x, y }) }), []);
  const history = useCreateStore(state => state.generationHistory.find(item => item.id === context?.id));
  useMenuTargetSelection(context, () => {
    if (history && useCreateStore.getState().activeHistoryId !== history.id) onRestore(history.id);
  });
  const download = async (item: GenerationHistorySet) => {
    if (downloadingId) return;
    setDownloadingId(item.id); setDownloadError("");
    try { await downloadGenerationSet(item.shots, item.title); }
    catch (error) { setDownloadError(error instanceof Error ? error.message : "다운로드를 준비하지 못했습니다."); }
    finally { setDownloadingId(null); }
  };
  return <>
    {downloadError && <p role="alert" style={{ padding: "0 12px", fontSize: 12 }}>{downloadError}</p>}
    {context && history && <ContextMenu x={context.x} y={context.y} height={78} label="히스토리 작업" onClose={close}>
      <button role="menuitem" disabled={Boolean(downloadingId) || !history.shots.some(shot => shot.status === "done" && shot.imageUrl)} onClick={() => { close(); void download(history); }}><Download />전체 다운로드</button>
      <button role="menuitem" disabled={deleteDisabled} onClick={() => { close(); if (window.confirm(`‘${history.title}’ 이미지셋을 삭제할까요?`)) onDelete(history.id); }}><Trash2 />삭제</button>
    </ContextMenu>}
  </>;
});
