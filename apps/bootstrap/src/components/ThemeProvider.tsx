"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  type ColorMode,
} from "@/lib/themes";

interface ThemeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Light/dark mode only. Color theme comes from the URL (`/[theme]/…`) and is
 * not managed here — no stylesheet swapping, no theme localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(DEFAULT_MODE);

  useEffect(() => {
    const domMode = document.documentElement.getAttribute("data-bs-theme");
    if (domMode === "light" || domMode === "dark") setModeState(domMode);
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    document.documentElement.setAttribute("data-bs-theme", next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
