"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
export function ProjectStoreHydration() {
  useEffect(() => {
    void useProjectStore.persist.rehydrate();
  }, []);
  return null;
}
