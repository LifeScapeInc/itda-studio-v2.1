"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/** Native select with hover-wheel stepping; preserve Ctrl+wheel browser zoom. */
export function WheelSelect({ onValueChange, ...props }: Omit<ComponentProps<"select">, "onChange"> & { onValueChange: (value: string) => void }) {
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let accumulated = 0;
    let lastTime = 0;
    const reset = () => { accumulated = 0; lastTime = 0; };
    const wheel = (event: WheelEvent) => {
      if (node.disabled || event.ctrlKey || event.metaKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      if (event.timeStamp - lastTime > 200 || Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0;
      accumulated += delta;
      lastTime = event.timeStamp;
      if (Math.abs(accumulated) < 40) return;
      const direction = Math.sign(accumulated);
      accumulated = 0;
      let index = node.selectedIndex + direction;
      while (index >= 0 && index < node.options.length && node.options[index].disabled) index += direction;
      if (index < 0 || index >= node.options.length) return;
      node.selectedIndex = index;
      onValueChange(node.value);
    };
    node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("mouseleave", reset);
    return () => { node.removeEventListener("wheel", wheel); node.removeEventListener("mouseleave", reset); };
  }, [onValueChange]);
  return <select {...props} ref={ref} onChange={event => onValueChange(event.currentTarget.value)} />;
}
