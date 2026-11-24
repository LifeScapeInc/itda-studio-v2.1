"use client";

import { useEffect, useEffectEvent } from "react";

/** Give the committed menu a paint before changing the heavier workspace selection. */
export function useMenuTargetSelection(target: object | null, onSelect: () => void) {
  const select = useEffectEvent(onSelect);
  useEffect(() => {
    if (!target) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => select());
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);
}
