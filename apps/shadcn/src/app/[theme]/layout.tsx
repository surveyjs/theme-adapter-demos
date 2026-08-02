import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  surveyAdapterHref,
  surveyOverridesHref,
  SURVEY_OVERRIDES_SHARED_HREF,
} from "@/lib/surveyAdapterCss";
import {
  DEFAULT_STYLE_ID,
  isVisualStyleId,
  VISUAL_STYLES,
  type VisualStyleId,
} from "@/lib/styles";

/**
 * Route-scoped survey adapter + overrides for the active visual style.
 */
export function generateStaticParams() {
  return VISUAL_STYLES.map((s) => ({ theme: s.id }));
}

export default async function ThemeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ theme: string }>;
}) {
  const { theme: themeParam } = await params;
  if (!isVisualStyleId(themeParam)) {
    redirect(`/${DEFAULT_STYLE_ID}`);
  }
  const style: VisualStyleId = themeParam;

  return (
    <>
      <link rel="stylesheet" href={surveyAdapterHref(style)} />
      <link rel="stylesheet" href={SURVEY_OVERRIDES_SHARED_HREF} />
      <link rel="stylesheet" href={surveyOverridesHref(style)} />
      {children}
    </>
  );
}
