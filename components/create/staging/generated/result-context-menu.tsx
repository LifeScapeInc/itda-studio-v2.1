"use client";
import { Bookmark, Download, Info, RefreshCw, RotateCcw } from "lucide-react";
import { ContextMenu } from "@/components/ui/context-menu";

export function ResultContextMenu({ x, y, bookmarked, canRegenerate, canEvaluate, onAction, onClose }: {
  x: number; y: number; bookmarked: boolean; canRegenerate: boolean; canEvaluate: boolean;
  onAction: (action: "regenerate" | "evaluate" | "download" | "bookmark" | "info") => void; onClose: () => void;
}) {
  const action = (value: Parameters<typeof onAction>[0]) => { onClose(); onAction(value); };
  return <ContextMenu x={x} y={y} label="생성 결과 작업" onClose={onClose}>
    <button role="menuitem" disabled={!canRegenerate} onClick={() => action("regenerate")}><RotateCcw />다시 생성</button>
    <button role="menuitem" disabled={!canEvaluate} onClick={() => action("evaluate")}><RefreshCw />재평가</button>
    <hr />
    <button role="menuitem" onClick={() => action("download")}><Download />내려받기</button>
    <button role="menuitem" onClick={() => action("bookmark")}><Bookmark fill={bookmarked ? "currentColor" : "none"} />{bookmarked ? "북마크 해제" : "북마크"}</button>
    <hr />
    <button role="menuitem" onClick={() => action("info")}><Info />정보보기</button>
  </ContextMenu>;
}
