"use client";

import { create } from "zustand";

export type StudioTheme = "light" | "dark";

const THEME_STORAGE_KEY = "itda-studio-v2.1:theme";

type ThemeStore = {
  theme: StudioTheme;
  hydrated: boolean;
  hydrate: () => void;
  toggleTheme: () => void;
};

function applyTheme(theme: StudioTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) {
      return;
    }

    queueMicrotask(() => {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      const theme: StudioTheme = saved === "dark" ? "dark" : "light";
      applyTheme(theme);
      set({ theme, hydrated: true });
    });
  },
  toggleTheme: () => {
    const theme: StudioTheme = get().theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme, hydrated: true });
  },
}));
