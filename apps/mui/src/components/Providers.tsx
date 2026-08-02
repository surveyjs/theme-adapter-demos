"use client";

import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme/theme";
import { AllQuestionsModeProvider } from "./AllQuestionsMode";
import { BorderlessModeProvider } from "./BorderlessMode";
import { MuiSurveyOverridesStyles } from "./MuiSurveyOverridesStyles";

/**
 * Client-side MUI runtime. ThemeProvider doubles as the CSS-variables provider
 * (because the theme was built with `cssVariables`), so `useColorScheme` works
 * anywhere below it. `defaultMode="light"` matches the InitColorSchemeScript in
 * the root layout. CssBaseline applies MUI's normalize + background/text tokens.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <MuiSurveyOverridesStyles />
      <BorderlessModeProvider>
        <AllQuestionsModeProvider>{children}</AllQuestionsModeProvider>
      </BorderlessModeProvider>
    </ThemeProvider>
  );
}
