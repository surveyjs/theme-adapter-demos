import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

/**
 * Shared "form submitted" screen rendered by BOTH the SurveyJS column
 * (SurveyForm) and the native column (NativeControls), so the two are identical.
 *
 * Same bordered rectangle as the form it replaces: `divider` border, page
 * background — deliberately NOT a green `Alert severity="success"`. The success
 * palette is fixed regardless of the active theme, and a `color="success"`
 * outlined button on the success fill put same-hue text on a same-hue
 * background, leaving the button unreadable. The primary button re-themes with
 * the rest of the chrome and matches the native column's "Complete".
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
    <Box sx={{ border: 1, borderColor: "divider", p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {message}
      </Typography>
      <Button variant="contained" sx={{ mt: 2 }} onClick={onEdit}>
        Edit Response
      </Button>
    </Box>
  );
}
