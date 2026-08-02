"use client";

import "@/lib/survey-ssr-environment";
import { useEffect, useMemo, useRef } from "react";
import { Survey } from "survey-react-ui";
import { allQuestionsSchema, createSurveyModel } from "@adapter/schemas";
import { useAllQuestionsMode } from "./AllQuestionsMode";
import { useBorderlessMode } from "./BorderlessMode";

// Same import order as SurveyForm: base V3 CSS first, MUI adapter on top.
// This page adds NO adapter code — it reuses the existing stylesheet verbatim.
import "survey-core/survey-core.min.css";
import "survey-core/themes/adapters/mui.min.css";

/**
 * All-questions gallery — the adapter's widest fidelity sweep. Builds ONE
 * survey-core model from the shared `all-questions` schema (showTOC is in the
 * JSON) and renders it through the stock `survey-react-ui` <Survey>, styled by
 * the existing MUI adapter. No component swaps, no custom renderers.
 *
 * The read-only ⇄ editable switch is host chrome (a native MUI <Switch> in a
 * <FormControlLabel>) that lives in the top menu (AllQuestionsToggle), shared
 * with this page through AllQuestionsModeContext. Toggling it sets `mode` on the
 * LIVE model — survey-core is reactive, so the form re-renders in place without
 * a rebuild or remount, preserving every answer.
 */
export function AllQuestionsGallery() {
  // Both switches live in the header; their state arrives via context.
  // `borderless` maps onto survey-core's `isCompact` — a non-serializable runtime
  // flag, never baked into the schema. The ref seeds it at CONSTRUCTION (below) so
  // the first render, SSR included, already carries the compact classes; applying
  // it only from the effect would paint the bordered default for a frame first,
  // which reads as a blink on refresh.
  const { readOnly } = useAllQuestionsMode();
  const { borderless } = useBorderlessMode();
  const borderlessRef = useRef(borderless);
  borderlessRef.current = borderless;

  // Build the model exactly once for the component's lifetime.
  const model = useMemo(() => {
    const m = createSurveyModel(allQuestionsSchema);
    m.showCompleteButton = false;
    m.isCompact = borderlessRef.current;
    return m;
  }, []);

  // Later flips of either switch drive the LIVE model — survey-core is reactive,
  // so the gallery re-renders in place: no rebuild, no remount, answers preserved.
  useEffect(() => {
    model.mode = readOnly ? "display" : "edit";
  }, [model, readOnly]);
  useEffect(() => {
    model.isCompact = borderless;
  }, [model, borderless]);

  // Server-rendered and hydrated — no mount gate. `@/lib/survey-ssr-environment`
  // stubs `settings.environment` for SSR; survey-core guards other DOM access.
  return <Survey model={model} />;
}
