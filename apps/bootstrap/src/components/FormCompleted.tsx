import { Button } from "react-bootstrap";

/**
 * Shared "form submitted" screen rendered by BOTH the SurveyJS column
 * (SurveyForm) and the native column (NativeControls), so the two are identical.
 *
 * Same bordered rectangle as the form it replaces: default border, page
 * background — deliberately NOT a green `alert-success`. A semantic success
 * tint is a fixed hue that ignores the active Bootswatch theme, and pairing it
 * with an `outline-success` button put same-hue text on a same-hue fill, which
 * left the button unreadable in several themes. The primary button re-themes
 * with the rest of the chrome and matches the native column's "Complete".
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
    <div className="border p-4">
      <p className="h6 mb-3">{message}</p>
      <Button variant="primary" onClick={onEdit}>
        Edit Response
      </Button>
    </div>
  );
}
