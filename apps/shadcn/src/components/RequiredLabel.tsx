import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { FieldLabel } from "@/components/ui/field";

/** Visible required-field indicator (asterisk). */
export function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

type RequiredLabelProps = ComponentPropsWithoutRef<typeof FieldLabel> & {
  children: ReactNode;
};

/** FieldLabel with a trailing required asterisk. */
export function RequiredLabel({ children, ...props }: RequiredLabelProps) {
  return (
    <FieldLabel {...props}>
      {children} <RequiredMark />
    </FieldLabel>
  );
}
