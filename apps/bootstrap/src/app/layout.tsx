import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminShell } from "@/components/AdminShell";
import { AllQuestionsModeProvider } from "@/components/AllQuestionsMode";
import { BorderlessModeProvider } from "@/components/BorderlessMode";
import { embeddedBootstrapScript } from "@/lib/embedded";
import { modeBootstrapScript } from "@/lib/themes";

export const metadata: Metadata = {
  title: "SurveyJS Theme Adapter for Bootstrap",
  description: "SurveyJS theme adapter demo for Bootstrap.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Marks <html> when the demo runs inside an iframe, so the shell can
          drop its navigation before the first paint.
        */}
        <script dangerouslySetInnerHTML={{ __html: embeddedBootstrapScript() }} />
        {/* Light/dark only — theme stylesheets live in [theme]/layout. */}
        <script dangerouslySetInnerHTML={{ __html: modeBootstrapScript() }} />
      </head>
      <body>
        <ThemeProvider>
          <BorderlessModeProvider>
            <AllQuestionsModeProvider>
              <AdminShell>{children}</AdminShell>
            </AllQuestionsModeProvider>
          </BorderlessModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
