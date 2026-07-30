import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

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
    <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
      <Alert severity="success" sx={{ mb: 0 }}>
        <AlertTitle sx={{ fontWeight: 600 }}>{message}</AlertTitle>
        <Button
          variant="outlined"
          color="success"
          size="small"
          sx={{ mt: 1 }}
          onClick={onEdit}
        >
          Edit Response
        </Button>
      </Alert>
    </Box>
  );
}
