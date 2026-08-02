import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import FormLabel, { type FormLabelProps } from "@mui/material/FormLabel";

/** Visible required-field indicator (asterisk). */
export function RequiredMark() {
  return (
    <Box component="span" sx={{ color: "error.main" }} aria-hidden>
      *
    </Box>
  );
}

type RequiredLabelProps = FormLabelProps & {
  children: ReactNode;
};

/** FormLabel with MUI's built-in required asterisk. */
export function RequiredLabel({ children, ...props }: RequiredLabelProps) {
  return (
    <FormLabel required {...props}>
      {children}
    </FormLabel>
  );
}
