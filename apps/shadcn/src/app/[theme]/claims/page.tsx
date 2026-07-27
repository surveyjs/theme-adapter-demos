import { medicalFormJson, medicalFormSchema, medicalFormSample } from "@adapter/schemas";
import { SurveyForm } from "@/components/SurveyForm";
import { NativeControls } from "@/components/NativeControls";
import { FormMetricsFooter } from "@/components/FormMetricsFooter";

/**
 * First (and, for this stage, only) route wired to SurveyJS — the proof point
 * for the shadcn theme adapter. The medical/insurance schema comes from
 * `@adapter/schemas` unchanged; styling is CSS-only via survey-core/themes/adapters.
 *
 * The native-controls column sits beside the form (equal width) so the adapter's
 * fidelity is verifiable by eye and re-themes in lockstep with the chrome. A
 * single "code cost" comparison footer below both columns makes the demo's
 * thesis measurable: SurveyJS reaches the form with a tiny, reusable renderer +
 * visually-authored JSON, while the native column needs a large hand-written
 * block per form.
 */

// Line count of the ONE reusable renderer that draws every SurveyJS form in the
// app — NOT the schema, and NOT the shared completion screen (that lives in
// FormCompleted.tsx, excluded from both counts). Recompute with:
//   wc -l src/components/SurveyForm.tsx
const SURVEYJS_LINES = 135;

// Line count of the hand-written native form — likewise excluding the shared
// completion screen. Measured here (a server component) rather than imported
// from NativeControls.tsx, because a plain value exported from a "use client"
// module becomes an unreadable client reference on the server. Recompute with:
//   wc -l src/components/NativeControls.tsx
const NATIVE_FORM_LINES = 758;

// Byte size of the form's JSON schema, computed live from the imported source so
// it never drifts from packages/schemas.
const MEDICAL_FORM_JSON_BYTES = new TextEncoder().encode(
  JSON.stringify(medicalFormJson),
).length;

export default function ClaimsPage() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2" style={{ "--sd-mobile-width": "0px" } as React.CSSProperties}>
      <SurveyForm
        schema={medicalFormSchema}
        completedMessage="Thank you. Your intake form has been submitted."
        prefillData={medicalFormSample}
      />
      <NativeControls />
      <div className="lg:col-span-2">
        <FormMetricsFooter
          surveyjsLines={SURVEYJS_LINES}
          nativeLines={NATIVE_FORM_LINES}
          jsonBytes={MEDICAL_FORM_JSON_BYTES}
        />
      </div>
    </div>
  );
}
