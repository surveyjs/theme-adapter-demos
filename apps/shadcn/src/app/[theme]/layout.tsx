import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import LayoutClient from "./layoutClient";
import {
  DEFAULT_STYLE_ID,
  isVisualStyleId,
  VISUAL_STYLES,
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
  return <LayoutClient theme={themeParam}>{children}</LayoutClient>
}
