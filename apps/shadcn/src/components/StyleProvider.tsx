"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { themeFromPathname } from "@adapter/schemas";
import {
  DEFAULT_STYLE_ID,
  isVisualStyleId,
  type VisualStyleId,
} from "@/lib/styles";

/**
 * Visual style from the URL (`/[theme]/…`). Applies `data-shadcn-style` and
 * exposes the id to UI components that pick per-style implementations.
 */
interface StyleContextValue {
  style: VisualStyleId;
}

const StyleContext = createContext<StyleContextValue | null>(null);

function applyStyle(style: VisualStyleId) {
  document.documentElement.setAttribute("data-shadcn-style", style);
}

export function StyleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segment = themeFromPathname(pathname);
  const style: VisualStyleId = isVisualStyleId(segment)
    ? segment
    : DEFAULT_STYLE_ID;

  useEffect(() => {
    applyStyle(style);
  }, [style]);

  return (
    <StyleContext.Provider value={{ style }}>{children}</StyleContext.Provider>
  );
}

export function useStyle(): StyleContextValue {
  const ctx = useContext(StyleContext);
  if (!ctx) throw new Error("useStyle must be used within <StyleProvider>");
  return ctx;
}
