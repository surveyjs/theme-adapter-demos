"use client";

import "@/lib/survey-ssr-environment";
import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Survey } from "survey-react-ui";
import type { Question } from "survey-core";
import {
  createSurveyModel,
  type SchemaInput,
  type SurveyData,
  type SurveyMode,
} from "@adapter/schemas";
import { useBorderlessMode } from "./BorderlessMode";
import { FormCompleted } from "./FormCompleted";

// Base V3 CSS FIRST, then the MUI adapter ON TOP so the adapter's `--sjs2-*`
// overrides (declared on the same `.sjs-theme-overrides` root that survey-core
// emits) win by source order. The adapter maps those variables onto MUI `--mui-*`
// tokens — there is NO SurveyJS-specific theme code: the form re-skins
// automatically whenever the active MUI scheme/palette changes. The `--mui-*`
// variables it reads exist only because the app's theme was built with
// `cssVariables` (see src/theme/theme.ts) — do not remove that flag.
//
// Shared app-local overrides (`/survey-overrides/mui.css`) plus optional
// per-palette overrides (`/survey-overrides/<id>.css`) load AFTER the adapter
// via <link>s (see surveyOverridesCss + MuiSurveyOverridesStyles) for host-only
// SurveyJS tweaks the adapter cannot cover.
import "survey-core/survey-core.min.css";
import "survey-core/themes/adapters/mui.min.css";
import "./SurveyForm.css";

/**
 * Renders a SurveyJS V3 model with the MUI theme adapter applied.
 *
 * CSS-only: it imports the adapter stylesheet and renders the headless model from
 * `@adapter/schemas` through the stock `survey-react-ui` <Survey> — no component
 * swaps, no custom renderer registration.
 */
export function SurveyForm({
  schema,
  data,
  mode,
  onComplete,
  completedMessage = "Thank you. Your response has been submitted.",
  prefillData,
  prefillLabel = "Prefill demo data",
}: {
  schema: SchemaInput;
  data?: SurveyData;
  /** `edit` (default) for an interactive form, `display` for read-only. */
  mode?: SurveyMode;
  /** Called with the response data when the survey is submitted. */
  onComplete?: (data: SurveyData) => void;
  /** Message shown on the custom completion screen (see below). */
  completedMessage?: string;
  /**
   * When provided, a custom "Prefill demo data" button is added to the survey's
   * navigation bar that fills the current page's answers in one click.
   */
  prefillData?: SurveyData;
  /** Label for the prefill button (see `prefillData`). */
  prefillLabel?: string;
}) {
  // "Borderless questions" switch (top menu) → survey-core's `isCompact`. It is
  // a non-serializable runtime flag, so it's set on the LIVE model rather than
  // baked into the schema. The ref seeds it at CONSTRUCTION (below) so the first
  // render — SSR included — already carries the compact classes; applying it only
  // from the effect would paint the bordered default for a frame first, which
  // reads as a blink on refresh. `borderless` stays out of the model's deps so
  // toggling the switch never rebuilds the model.
  const { borderless } = useBorderlessMode();
  const borderlessRef = useRef(borderless);
  borderlessRef.current = borderless;

  const model = useMemo(() => {
    const m = createSurveyModel(schema, { data, mode });
    m.isCompact = borderlessRef.current;
    return m;
  }, [schema, data, mode]);

  // Later flips of the switch: survey-core is reactive, so the form re-renders
  // in place — no rebuild, no remount, answers preserved.
  useEffect(() => {
    model.isCompact = borderless;
  }, [model, borderless]);

  // Optional "Prefill demo data" custom button. Added to the survey's OWN
  // navigation bar through the public `addNavigationItem` API (it renders a
  // stock `sv-nav-btn` — host-level use of the model API, NOT a renderer/
  // component override, so the adapter stays CSS-only). One click fills the
  // answers on the CURRENT page only, leaving the other pages untouched so the
  // end-user prefills each step as they reach it; `mergeData` keeps anything
  // already entered and fills the rest. Re-added if the model is rebuilt
  // (schema/data/mode change).
  useEffect(() => {
    if (!prefillData) return;
    const id = "sv-prefill-demo";
    model.addNavigationItem({
      id,
      title: prefillLabel,
      // Narrow the shared prefill object to the fields whose questions live on
      // the current page, then merge just those.
      action: () => {
        const names = new Set(
          model.currentPage.questions.map((q: Question) => q.getValueName()),
        );
        const pageData = Object.fromEntries(
          Object.entries(prefillData).filter(([key]) => names.has(key)),
        );
        model.mergeData(pageData);
      },
    });
    return () => {
      model.navigationBar.removeActionById(id);
    };
  }, [model, prefillData, prefillLabel]);

  // On completion, hide the SurveyJS widget and show our own success screen
  // (matching the native column's submitted state) instead of the model's
  // default completed page. This is host-level React reacting to a model
  // event — NOT a SurveyJS renderer/component override, so the adapter stays
  // CSS-only. Reset when the model is rebuilt (schema/data/mode change).
  const [completed, setCompleted] = useState(false);
  useEffect(() => setCompleted(false), [model]);
  useEffect(() => {
    const handler = (sender: typeof model) => {
      setCompleted(true);
      onComplete?.(sender.data);
    };
    model.onComplete.add(handler);
    return () => model.onComplete.remove(handler);
  }, [model, onComplete]);

  // "Edit Response" — keep the answers (clear(false) leaves data intact, just
  // flips the model out of its completed state) and show the widget again.
  const handleEdit = () => {
    model.clear(false);
    setCompleted(false);
  };

  // The form is server-rendered (SSR) and hydrated on the client — there is NO
  // mount gate. `@/lib/survey-ssr-environment` stubs `settings.environment` for
  // SSR; survey-core guards other DOM access (see DomDocumentHelper), so the
  // model builds and the stock <Survey> renders to HTML during Next's prerender.
  // Only the Creator (Builder route) stays client-only, because its constructor
  // touches `navigator` at build time.
  if (completed) {
    return <FormCompleted message={completedMessage} onEdit={handleEdit} />;
  }

  // Same bordered rectangle as the native column (and this column's completion
  // screen): default border, page background — no Card chrome. The survey body
  // supplies its own inner padding; `overflow: hidden` clips the title bar.
  return (
    <Box sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
      <Survey model={model} />
    </Box>
  );
}
