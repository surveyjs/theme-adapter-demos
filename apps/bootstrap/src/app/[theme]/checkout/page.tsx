import { checkoutSchema, checkoutSample } from "@adapter/schemas";
import { SurveyForm } from "@/components/SurveyForm";

/**
 * Checkout — the clean parity page. A single SurveyJS multi-page wizard
 * (per-page validation + masked card/expiry inputs) rendered straight through
 * the Bootstrap theme adapter. The schema comes from `@adapter/schemas` unchanged;
 * there is nothing app-specific here beyond the chrome around the form.
 */
export default function CheckoutPage() {
  return (
    <div className="row justify-content-center">
      <SurveyForm schema={checkoutSchema} prefillData={checkoutSample} />
    </div>
  );
}
