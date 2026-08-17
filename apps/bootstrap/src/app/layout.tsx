import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/600.css";
import "@fontsource/roboto/700.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminShell } from "@/components/AdminShell";
import { AllQuestionsModeProvider } from "@/components/AllQuestionsMode";
import { BorderlessModeProvider } from "@/components/BorderlessMode";
import { modeBootstrapScript } from "@/lib/themes";

export const metadata: Metadata = {
  title: "SurveyJS Theme Adapter for Bootstrap",
  description: "SurveyJS theme adapter demo for Bootstrap.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
