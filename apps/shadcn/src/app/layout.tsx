import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminShell } from "@/components/AdminShell";
import { AllQuestionsModeProvider } from "@/components/AllQuestionsMode";
import { BorderlessModeProvider } from "@/components/BorderlessMode";
import { embeddedBootstrapScript } from "@/lib/embedded";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurveyJS Theme Adapter for shadcn/ui",
  description: "SurveyJS theme adapter demo for shadcn/ui.",
};

// Pre-paint: visual style from the URL path; base color / accent / radius from
// localStorage. Survey adapter CSS is linked in [theme]/layout.
const STYLE_BOOTSTRAP = `(function(){try{var ok=['base-nova','base-vega','base-maia','base-lyra','base-mira','base-luma','base-sera','base-rhea','default','new-york'];var seg=location.pathname.split('/').filter(Boolean)[0];document.documentElement.setAttribute('data-shadcn-style',ok.indexOf(seg)>-1?seg:'base-rhea');var c=localStorage.getItem('shadcn-base-color');var okc=['neutral','gray','zinc','stone','slate'];document.documentElement.setAttribute('data-shadcn-base-color',okc.indexOf(c)>-1?c:'neutral');var t=localStorage.getItem('shadcn-theme');var okt=['default','red','rose','orange','green','blue','yellow','violet'];document.documentElement.setAttribute('data-shadcn-theme',okt.indexOf(t)>-1?t:'default');var r=localStorage.getItem('shadcn-radius');var okr=['default','0','0.25','0.5','0.75','1'];document.documentElement.setAttribute('data-shadcn-radius',okr.indexOf(r)>-1?r:'default');}catch(e){document.documentElement.setAttribute('data-shadcn-style','base-rhea');document.documentElement.setAttribute('data-shadcn-base-color','neutral');document.documentElement.setAttribute('data-shadcn-theme','default');document.documentElement.setAttribute('data-shadcn-radius','default');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Marks <html> when the demo runs inside an iframe, so the shell can
          drop its navigation before the first paint.
        */}
        <script dangerouslySetInnerHTML={{ __html: embeddedBootstrapScript() }} />
        <script dangerouslySetInnerHTML={{ __html: STYLE_BOOTSTRAP }} />
      </head>
      <body>
        <ThemeProvider>
          <AllQuestionsModeProvider>
            <BorderlessModeProvider>
              <AdminShell>{children}</AdminShell>
            </BorderlessModeProvider>
          </AllQuestionsModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
