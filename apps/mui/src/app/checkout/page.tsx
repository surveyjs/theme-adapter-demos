import Box from "@mui/material/Box";
import { checkoutSchema, checkoutSample } from "@adapter/schemas";
import { SurveyForm } from "@/components/SurveyForm";

/**
 * Checkout — the clean parity page. A single SurveyJS multi-page wizard
 * (per-page validation + masked card/expiry inputs) rendered straight through
 * the MUI theme adapter. The schema comes from `@adapter/schemas` unchanged; there
 * is nothing app-specific here beyond the MUI chrome around the form.
 */
export default function CheckoutPage() {
  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: { xs: "100%", xl: 760 },
        height: "100%",
      }}
    >
      <SurveyForm schema={checkoutSchema} prefillData={checkoutSample} />
    </Box>
  );
}
