import { Button } from "@/components/ui/button";

/**
 * Shared "form submitted" screen rendered by BOTH the SurveyJS column
 * (SurveyForm) and the native column (NativeControls), so the two are identical.
 *
 * Same bordered rectangle as the form it replaces: default border, page
 * background — deliberately NOT a green success tint. Hard-coded `green-*`
 * utilities sit outside the shadcn token set, so they ignore the active style
 * and both light/dark modes, and the low-contrast fill swallowed the outline
 * button. The default button re-themes with the rest of the chrome and matches
 * the native column's "Complete".
 *
 * It lives in its own file on purpose: the /claims "code cost" footer measures
 * the form-BUILDING code in each column, so this shared completion chrome is
 * deliberately kept OUT of either form's line count.
 */
export function FormCompleted({
  message,
  onEdit,
}: {
  message: string;
  /** "Edit Response" — return to the editable form with answers intact. */
  onEdit: () => void;
}) {
  return (
    <div className="border p-6">
      <p className="font-semibold">{message}</p>
      <Button className="mt-4" onClick={onEdit}>
        Edit Response
      </Button>
    </div>
  );
}
