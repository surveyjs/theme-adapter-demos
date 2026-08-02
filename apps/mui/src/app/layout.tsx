import type { Metadata } from "next";
import type { ReactNode } from "react";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Providers } from "@/components/Providers";
import { AdminShell } from "@/components/AdminShell";
import { surveyOverridesBootstrapScript } from "@/lib/surveyOverridesCss";

export const metadata: Metadata = {
  title: "SurveyJS Theme Adapter for MUI",
  description: "SurveyJS theme adapter demo for MUI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // InitColorSchemeScript applies the persisted scheme class to <html> before
    // hydration, so the client markup intentionally differs from SSR here.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Creates the app-local SurveyJS overrides <link> for the persisted
          palette. Runs while the document is still parsing so the sheet is
          render-blocking at first paint. (MuiSurveyOverridesStyles re-points
          the same element on palette change.)
        */}
        <script
          dangerouslySetInnerHTML={{ __html: surveyOverridesBootstrapScript() }}
        />
      </head>
      <body>
        {/*
          No-flash bootstrap. Must be the FIRST node in <body>: it runs before
          paint, reads the persisted mode + color-scheme pair from localStorage,
          and applies the matching class to <html> — covering BOTH the light/dark
          axis and the palette axis through MUI's native machinery (no hand-rolled
          attribute). `attribute="class"` matches the theme's colorSchemeSelector.
        */}
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        {/* Emotion SSR cache for the App Router (prevents style flicker/dupes). */}
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <Providers>
            <AdminShell>{children}</AdminShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
