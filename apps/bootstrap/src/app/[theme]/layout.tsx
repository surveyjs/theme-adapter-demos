import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  colorThemes,
  DEFAULT_THEME,
  isColorThemeId,
  surveyAdapterHref,
  surveyOverridesHref,
  SURVEY_OVERRIDES_SHARED_HREF,
  themeHref,
  type ColorThemeId,
} from "@/lib/themes";

/**
 * Route-scoped theme sheets: Bootswatch chrome + SurveyJS adapter + overrides.
 * Fixed per URL — no dynamic <link> swapping on theme change.
 */
export function generateStaticParams() {
  return colorThemes.map((t) => ({ theme: t.id }));
}

export default async function ThemeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ theme: string }>;
}) {
  const { theme: themeParam } = await params;
  if (!isColorThemeId(themeParam)) {
    redirect(`/${DEFAULT_THEME}`);
  }
  const theme: ColorThemeId = themeParam;

  return (
    <>
      <link rel="stylesheet" href={themeHref(theme)} />
      <link rel="stylesheet" href={surveyAdapterHref(theme)} />
      <link rel="stylesheet" href={SURVEY_OVERRIDES_SHARED_HREF} />
      <link rel="stylesheet" href={surveyOverridesHref(theme)} />
      {children}
    </>
  );
}
