"use client";

import { create } from "zustand";
import type { BookId } from "./content";

export type Theme = "light" | "dark";

const THEME_KEY = "vstem-dash-theme";

/**
 * Панельдің ортақ күйі.
 *
 * Мұнда тек беттен бетке өткенде де сақталуы керек күй тұрады: тема және
 * цифрлық кітапханада ашылған кітап. Пәндік модульдер мен ресурстардың
 * мазмұны бұрын осы дүкен арқылы ашылатын бүйір терезеде болатын — қазір
 * олардың әрқайсысының өз маршруты бар, сондықтан күйді URL шешеді.
 */
type DashboardState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  /** Ашық тұрған 3D кітап (Цифрлық кітапхана). */
  book: BookId | null;
  openBook: (id: BookId | null) => void;
};

export const useDashboard = create<DashboardState>((set, get) => ({
  theme: "light",

  setTheme: (theme) => {
    set({ theme });
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Жеке режимде localStorage жабық болуы мүмкін — тема сессия ішінде ғана сақталады.
    }
  },

  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

  book: null,
  openBook: (id) => set({ book: id }),
}));

/** Бетті ашқанда сақталған теманы қалпына келтіру. */
export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}
