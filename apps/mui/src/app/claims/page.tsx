import Box from "@mui/material/Box";
import { medicalFormSchema, medicalFormSample } from "@adapter/schemas";
import { SurveyForm } from "@/components/SurveyForm";
import { NativeControls } from "@/components/NativeControls";
import { FormMetricsFooter } from "@/components/FormMetricsFooter";

/**
 * First (and, for this stage, only) route wired to SurveyJS — the proof point
 * for the MUI theme adapter. The medical/insurance schema comes from
 * `@adapter/schemas` unchanged; styling is CSS-only via survey-core/themes/adapters.
 *
 * The native-controls column sits beside the form (equal width) so the adapter's
 * fidelity is verifiable by eye and re-themes in lockstep with the chrome. A
 * single "code cost" comparison footer below both columns makes the demo's
 * thesis measurable: SurveyJS reaches the form with a tiny, reusable renderer +
 * visually-authored JSON, while the native column needs a large hand-written
 * block per form.
 */

// The footer's figures live in src/content/formMetrics.ts — the single source
// of truth this page deliberately does NOT duplicate.

export default function ClaimsPage() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 4,
        alignItems: "start",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
      }}
    >
      <SurveyForm
        schema={medicalFormSchema}
        completedMessage="Thank you. Your intake form has been submitted."
        prefillData={medicalFormSample}
      />
      <NativeControls />
      <Box sx={{ gridColumn: { lg: "1 / -1" } }}>
        <FormMetricsFooter />
      </Box>
    </Box>
  );
}
