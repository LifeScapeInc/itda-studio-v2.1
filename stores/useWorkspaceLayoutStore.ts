"use client";

import { create } from "zustand";
import {
  MATERIAL_PANEL_DEFAULT_WIDTH,
  MATERIAL_PANEL_MAX_WIDTH,
  MATERIAL_PANEL_MIN_WIDTH,
  SETTINGS_PANEL_DEFAULT_WIDTH,
  SETTINGS_PANEL_MAX_WIDTH,
  SETTINGS_PANEL_MIN_WIDTH,
  clampPanelWidth,
} from "@/system/layout/workspace-layout";

type WorkspaceLayoutStore = {
  navigationCollapsed: boolean;
  materialPanelWidth: number;
  settingsPanelWidth: number;
  toggleNavigation: () => void;
  resizeMaterialPanel: (delta: number) => void;
  resizeSettingsPanel: (delta: number) => void;
};

export const useWorkspaceLayoutStore = create<WorkspaceLayoutStore>((set) => ({
  navigationCollapsed: false,
  materialPanelWidth: MATERIAL_PANEL_DEFAULT_WIDTH,
  settingsPanelWidth: SETTINGS_PANEL_DEFAULT_WIDTH,
  toggleNavigation: () => {
    set((state) => ({
      navigationCollapsed: !state.navigationCollapsed,
    }));
  },
  resizeMaterialPanel: (delta) => {
    set((state) => ({
      materialPanelWidth: clampPanelWidth(
        state.materialPanelWidth + delta,
        MATERIAL_PANEL_MIN_WIDTH,
        MATERIAL_PANEL_MAX_WIDTH,
      ),
    }));
  },
  resizeSettingsPanel: (delta) => {
    set((state) => ({
      settingsPanelWidth: clampPanelWidth(
        state.settingsPanelWidth + delta,
        SETTINGS_PANEL_MIN_WIDTH,
        SETTINGS_PANEL_MAX_WIDTH,
      ),
    }));
  },
}));
