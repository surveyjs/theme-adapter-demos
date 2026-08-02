"use client";

import { useEffect, useState } from "react";
import { slk } from "survey-core";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import type { SurveyJSON } from "@adapter/schemas";

// Layering, bottom → top, mirrors SurveyForm:
//   1. survey-core base      — the headless library's V3 stylesheet
//   2. survey-creator-core   — the Creator chrome, built ON TOP of (1) and
//                              consuming the SAME `--sjs2-*` custom properties
//                              on the SAME `.sjs-theme-overrides` theme root
//   3. the MUI adapter        — maps `--sjs2-* → --mui-*` on `.sjs-theme-overrides`
//   4. app-local overrides    — `/survey-overrides/mui.css` (always) + optional
//                              `/survey-overrides/<palette-id>.css` (swappable
//                              <link>; host-only SurveyJS tweaks the adapter
//                              cannot cover)
//
// KEY INSIGHT (prompt 4): there is intentionally NO separate Creator adapter.
// The Creator emits the same `.sjs-theme-overrides` theme root the form does, so
// the existing form adapter's variable overrides cascade into the Creator chrome
// (toolbar, tabs, toolbox, property grid, designer surface) automatically. This
// file authors zero new adapter CSS. The `--mui-*` variables the adapter reads
// exist only because the app theme was built with `cssVariables` (theme.ts), and
// the Creator renders inside that same ThemeProvider (Providers → AdminShell),
// so it re-themes in lockstep with the switcher.
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import "survey-core/themes/adapters/mui.min.css";

// Register the SurveyJS commercial license so the Creator runs without the
// unlicensed nag/watermark. Set once at module load — before any Creator is
// constructed — and shared verbatim across all adapter apps.
slk("ZG9tYWluczpzdXJ2ZXlqcy5pbyxzdXJ2ZXlqc25leHQsbG9jYWxob3N0OzE9MjAzNi0wMy0yNywyPTIwMzYtMDMtMjcsND0yMDM2LTAzLTI3LDg9MjAzNi0wMy0yNw==");

/**
 * Mounts the SurveyJS V3 Creator on the Builder route, seeded with a shared
 * schema from `@adapter/schemas` so the builder edits the very same definition
 * the other routes render.
 *
 * CSS-only, like the rest of the MUI adapter: it renders the stock
 * `survey-creator-react` component with no renderer/component overrides and no
 * Creator-specific theme code. Re-theming rides entirely on the shared
 * `--sjs2-*` overrides resolving against the active MUI scheme/palette.
 */
export function BuilderCreator({ json }: { json: SurveyJSON }) {
  // The Creator's constructor reaches for the browser DOM `environment`
  // (`navigator`), which is absent during Next's server prerender — so unlike
  // the headless SurveyModel it CANNOT be built at render/SSR time. Construct it
  // only after mount, client-side, and render nothing until it exists.
  const [creator, setCreator] = useState<SurveyCreator | null>(null);

  useEffect(() => {
    const instance = new SurveyCreator({
      showDesignerTab: true,
      showPreviewTab: true,
      showJSONEditorTab: true,
      showLogicTab: true,
      showTranslationTab: true,
      // Persisting is out of scope for the adapter proof — no save handler.
      isAutoSave: false,
    });
    instance.JSON = json;
    setCreator(instance);
  }, [json]);

  if (!creator) {
    return <div aria-busy="true" style={{ height: "100%", minHeight: "40rem" }} />;
  }

  // The Creator is full-height chrome. The Builder route renders edge-to-edge
  // (see AdminShell), so fill the parent's height outright — the toolbox /
  // designer / property grid then get the whole viewport below the header.
  return (
    <div style={{ height: "100%", minHeight: "40rem" }}>
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
}
