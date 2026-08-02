import { Alert, Button } from "react-bootstrap";

/**
 * Shared "form submitted" screen rendered by BOTH the SurveyJS column
 * (SurveyForm) and the native column (NativeControls), so the two are identical.
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
    <div className="border p-3">
      <Alert variant="success" className="mb-0">
        <Alert.Heading className="h6">{message}</Alert.Heading>
        <Button
          variant="outline-success"
          size="sm"
          className="mt-2"
          onClick={onEdit}
        >
          Edit Response
        </Button>
      </Alert>
    </div>
  );
}
