"use client";

import { usePathname } from "next/navigation";
import { Form } from "react-bootstrap";
import { isActiveRoute, routes } from "@adapter/schemas";
import { useAllQuestionsMode } from "./AllQuestionsMode";

/**
 * Header control for the All-Questions gallery's read-only ⇄ editable mode.
 * Route-scoped via theme-agnostic page path.
 */
export function AllQuestionsToggle() {
  const pathname = usePathname();
  const { readOnly, setReadOnly } = useAllQuestionsMode();

  if (!isActiveRoute(pathname, routes.allQuestions)) return null;

  return (
    <Form.Check
      type="switch"
      id="all-questions-readonly"
      className="mb-0"
      checked={readOnly}
      onChange={(e) => setReadOnly(e.target.checked)}
      label="Read-only"
    />
  );
}
