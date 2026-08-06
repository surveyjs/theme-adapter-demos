"use client";

import { useEffect, useState } from "react";
import { slk } from "survey-core";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import type { SurveyJSON } from "@adapter/schemas";
import {
  observeCreatorAcePalette,
  syncCreatorAcePalette,
} from "@/lib/setupAceJsonEditor";

// Layering, bottom → top, mirrors SurveyForm:
//   1. survey-core base      — the headless library's V3 stylesheet
//   2. survey-creator-core   — the Creator chrome, built ON TOP of (1) and
//                              consuming the SAME `--sjs2-*` custom properties
//   3. the per-theme Bootstrap adapter — maps `--sjs2-* → --bs-*` on
//      `.sjs-theme-overrides`, loaded as a swappable <link> by the pre-paint
//      script + ThemeProvider (keyed to the active theme), not imported here.
//
// KEY INSIGHT (prompt 5): there is intentionally NO separate Creator adapter.
// The Creator emits the same `.sd-theme-root` theme root the form does, so the
// existing form adapter's variable overrides are expected to cascade into the
// Creator chrome automatically. This file authors zero new adapter CSS.
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

// Register the SurveyJS commercial license so the Creator runs without the
// unlicensed nag/watermark. Set once at module load — before any Creator is
// constructed — and shared verbatim across all adapter apps.
slk("ZG9tYWluczpzdXJ2ZXlqcy5pbyxzdXJ2ZXlqc25leHQsbG9jYWxob3N0OzE9MjAzNi0wMy0yNywyPTIwMzYtMDMtMjcsND0yMDM2LTAzLTI3LDg9MjAzNi0wMy0yNw==");

/**
 * Mounts the SurveyJS V3 Creator on the Builder route, seeded with a shared
 * schema from `@adapter/schemas` so the builder edits the very same definition
 * the other routes render.
 *
 * CSS-only, like the rest of the Bootstrap adapter: it renders the stock
 * `survey-creator-react` component with no renderer/component overrides and no
 * Creator-specific theme code. Re-theming rides entirely on the shared
 * `--sjs2-*` overrides changing with the Bootstrap theme.
 *
 * Ace is wired via `@/lib/setupAceJsonEditor` so the JSON Editor uses Ace with
 * clouds_midnight when the host app is in a dark color mode.
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
    syncCreatorAcePalette(instance);
    setCreator(instance);
    return observeCreatorAcePalette(instance);
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
