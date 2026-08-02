"use client";

import { useEffect } from "react";
import { useColorScheme } from "@mui/material/styles";
import {
  SURVEY_OVERRIDES_LINK_ID,
  SURVEY_OVERRIDES_SHARED_LINK_ID,
  paletteIdForLightScheme,
  surveyOverridesHref,
} from "@/lib/surveyOverridesCss";

/**
 * Points the per-palette survey overrides <link> at the active palette's sheet.
 * `mui.css` holds shared host tweaks (always on); the MUI adapter itself is a
 * single import — only the optional per-palette sheet swaps.
 *
 * The <link>s are created before paint by the inline script in the root layout —
 * this only re-points the per-palette one after a palette change.
 */
export function MuiSurveyOverridesStyles() {
  const { lightColorScheme } = useColorScheme();
  const paletteId = paletteIdForLightScheme(lightColorScheme);

  useEffect(() => {
    const sharedLink = document.getElementById(SURVEY_OVERRIDES_SHARED_LINK_ID);
    const link = document.getElementById(SURVEY_OVERRIDES_LINK_ID);
    // Keep shared then per-palette host overrides after the MUI adapter.
    if (sharedLink instanceof HTMLLinkElement) {
      document.head.appendChild(sharedLink);
    }
    if (link instanceof HTMLLinkElement) {
      link.setAttribute("href", surveyOverridesHref(paletteId));
      document.head.appendChild(link);
    }
  }, [paletteId]);

  return null;
}
