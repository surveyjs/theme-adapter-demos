"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Shared "Borderless questions" state for every survey in the app.
 *
 * The switch that flips this lives in the top menu (BorderlessToggle), but the
 * live SurveyModels it drives live in the pages (SurveyForm / AllQuestionsGallery).
 * This tiny context bridges them so the header switch and every survey stay in
 * sync without lifting any model out of its page. It maps onto survey-core's
 * `survey.isCompact` — a non-serializable runtime flag that drops the per-question
 * border for questions sitting directly on a page (questions inside a panel are
 * unaffected). It is host chrome only — no SurveyJS-specific theme/renderer code.
 */
interface BorderlessModeValue {
  borderless: boolean;
  setBorderless: (value: boolean) => void;
}

const BorderlessModeContext = createContext<BorderlessModeValue | null>(null);

export function BorderlessModeProvider({ children }: { children: ReactNode }) {
  const [borderless, setBorderless] = useState(true);
  return (
    <BorderlessModeContext.Provider value={{ borderless, setBorderless }}>
      {children}
    </BorderlessModeContext.Provider>
  );
}

export function useBorderlessMode(): BorderlessModeValue {
  const ctx = useContext(BorderlessModeContext);
  if (!ctx) {
    throw new Error(
      "useBorderlessMode must be used within a BorderlessModeProvider",
    );
  }
  return ctx;
}
