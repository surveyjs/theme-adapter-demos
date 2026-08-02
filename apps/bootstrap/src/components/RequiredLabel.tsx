import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Form } from "react-bootstrap";

/** Visible required-field indicator (asterisk). */
export function RequiredMark() {
  return (
    <span className="text-danger" aria-hidden="true">
      *
    </span>
  );
}

type RequiredLabelProps = ComponentPropsWithoutRef<typeof Form.Label> & {
  children: ReactNode;
};

/** Form.Label with a trailing required asterisk. */
export function RequiredLabel({ children, ...props }: RequiredLabelProps) {
  return (
    <Form.Label {...props}>
      {children} <RequiredMark />
    </Form.Label>
  );
}
