"use client";

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useCreateStore } from "@/stores/useCreateStore";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { downloadGenerationImage } from "@/system/create/download-images";
import type { LibraryGenerationShot } from "@/system/create/generation-library";
import { ResultContextMenu } from "./result-context-menu";
import { useMenuTargetSelection } from "@/components/ui/use-menu-target-selection";

export type ResultContextMenuHandle = {
  open: (id: string, x: number, y: number) => void;
};

// Keep transient menu state and subscriptions outside the image canvas.
export const ResultContextMenuController = forwardRef<ResultContextMenuHandle, {
  onShowInfo: (shots: LibraryGenerationShot[]) => void;
}>(function ResultContextMenuController({ onShowInfo }, ref) {
  const [context, setContext] = useState<{ id: string; x: number; y: number } | null>(null);
  const close = useCallback(() => setContext(null), []);
  useImperativeHandle(ref, () => ({ open: (id, x, y) => setContext({ id, x, y }) }), []);
  const shot = useCreateStore(state => state.generationShots.find(item => item.id === context?.id)) as LibraryGenerationShot | undefined;
  const evaluating = useCreateStore(state => Boolean(context && state.reevaluatingIds.includes(context.id)));
  useMenuTargetSelection(context, () => {
    if (!shot || shot.status !== "done" || !shot.imageUrl) return;
    const state = useCreateStore.getState();
    if (!state.selectedShotIds.includes(shot.id)) state.selectShot(shot.id);
    else if (state.selectedShotId !== shot.id) useCreateStore.setState({ selectedShotId: shot.id, generationPanelTab: "evaluation" });
  });
  if (!context || shot?.status !== "done" || !shot.imageUrl) return null;

  return <ResultContextMenu x={context.x} y={context.y} bookmarked={shot.bookmarked}
    canRegenerate={true} canEvaluate={!evaluating} onClose={close}
    onAction={action => {
      const state = useCreateStore.getState();
      if (!state.selectedShotIds.includes(shot.id)) state.selectShot(shot.id);
      if (action === "regenerate") void state.retryShot(shot.id, useAppSettingsStore.getState().mockMode, true);
      else if (action === "evaluate") void state.reevaluateShot(shot.id);
      else if (action === "download") downloadGenerationImage(shot);
      else if (action === "bookmark") state.toggleBookmark(shot.id);
      else onShowInfo([shot]);
    }} />;
});
