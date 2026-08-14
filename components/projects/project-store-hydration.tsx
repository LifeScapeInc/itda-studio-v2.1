"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
export function ProjectStoreHydration() {
  useEffect(() => {
    void Promise.resolve(useProjectStore.persist.rehydrate()).finally(() => {
      useProjectStore.getState().markHydrated();
    });
  }, []);
  return null;
}
