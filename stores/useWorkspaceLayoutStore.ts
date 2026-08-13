"use client";

import { create } from "zustand";
import {
  MATERIAL_PANEL_DEFAULT_WIDTH,
  MATERIAL_PANEL_MAX_WIDTH,
  MATERIAL_PANEL_MIN_WIDTH,
  SETTINGS_PANEL_DEFAULT_WIDTH,
  SETTINGS_PANEL_MAX_WIDTH,
  SETTINGS_PANEL_MIN_WIDTH,
  FURNITURE_GALLERY_PANEL_DEFAULT_WIDTH,
  FURNITURE_GALLERY_PANEL_MAX_WIDTH,
  FURNITURE_GALLERY_PANEL_MIN_WIDTH,
  BOOKMARK_DETAILS_PANEL_DEFAULT_WIDTH,
  BOOKMARK_DETAILS_PANEL_MAX_WIDTH,
  BOOKMARK_DETAILS_PANEL_MIN_WIDTH,
  clampPanelWidth,
} from "@/system/layout/workspace-layout";

type WorkspaceLayoutStore = {
  navigationCollapsed: boolean;
  materialPanelWidth: number;
  settingsPanelWidth: number;
  furnitureGalleryPanelWidth: number;
  bookmarkDetailsPanelWidth: number;
  toggleNavigation: () => void;
  resizeMaterialPanel: (delta: number) => void;
  resizeSettingsPanel: (delta: number) => void;
  resizeFurnitureGalleryPanel: (delta: number) => void;
  resizeBookmarkDetailsPanel: (delta: number) => void;
};

export const useWorkspaceLayoutStore = create<WorkspaceLayoutStore>((set) => ({
  navigationCollapsed: false,
  materialPanelWidth: MATERIAL_PANEL_DEFAULT_WIDTH,
  settingsPanelWidth: SETTINGS_PANEL_DEFAULT_WIDTH,
  furnitureGalleryPanelWidth: FURNITURE_GALLERY_PANEL_DEFAULT_WIDTH,
  bookmarkDetailsPanelWidth: BOOKMARK_DETAILS_PANEL_DEFAULT_WIDTH,
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
  resizeFurnitureGalleryPanel: (delta) => {
    set((state) => ({
      furnitureGalleryPanelWidth: clampPanelWidth(
        state.furnitureGalleryPanelWidth + delta,
        FURNITURE_GALLERY_PANEL_MIN_WIDTH,
        FURNITURE_GALLERY_PANEL_MAX_WIDTH,
      ),
    }));
  },
  resizeBookmarkDetailsPanel: (delta) => {
    set((state) => ({
      bookmarkDetailsPanelWidth: clampPanelWidth(
        state.bookmarkDetailsPanelWidth + delta,
        BOOKMARK_DETAILS_PANEL_MIN_WIDTH,
        BOOKMARK_DETAILS_PANEL_MAX_WIDTH,
      ),
    }));
  },
}));
