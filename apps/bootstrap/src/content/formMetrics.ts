import { medicalFormJson, type FormMetricsInput } from "@adapter/schemas";

/**
 * Single source of truth for the Patient Intake "code cost" comparison in this
 * app. The heading, the scope line and every table cell in `FormMetricsFooter`
 * are derived from this object, so the figures cannot drift between them.
 *
 * Line counts are NON-EMPTY, NON-COMMENT lines of the two files linked below,
 * counted by identical rules on both sides (imports included, tests/stories and
 * generated files excluded). The shared completion screen (`FormCompleted.tsx`)
 * is excluded from both columns. Recount both files together whenever either
 * one changes — a stale ratio is worse than no ratio.
 */

const REPO_BLOB = "https://github.com/surveyjs/theme-adapter-demos/blob/main";

export const FORM_METRICS: FormMetricsInput = {
  framework: "Bootstrap",

  // The ONE reusable renderer that draws every SurveyJS form in the app — code
  // only; the JSON schema is reported separately (see `jsonBytes`).
  surveyjsLines: 85,

  // The hand-written native implementation of the same Patient Intake form.
  // NativeControls.css (65 further lines) is NOT counted, so the native column
  // is if anything understated.
  nativeLines: 629,

  // Computed live from the imported schema so it never drifts from
  // packages/schemas. Measured here (a server-safe module) rather than inside a
  // "use client" file, where a plain export becomes an opaque client reference.
  jsonBytes: new TextEncoder().encode(JSON.stringify(medicalFormJson)).length,

  surveyjsFileUrl: `${REPO_BLOB}/apps/bootstrap/src/components/SurveyForm.tsx`,
  nativeFileUrl: `${REPO_BLOB}/apps/bootstrap/src/components/NativeControls.tsx`,
};
