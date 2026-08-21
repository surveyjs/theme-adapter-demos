"use client";

import { usePathname } from "next/navigation";
import { Form } from "react-bootstrap";
import { isActiveRoute, pagePathFromPathname, routes } from "@adapter/schemas";
import { useBorderlessMode } from "./BorderlessMode";

/**
 * Header control for the "Borderless questions" mode (survey-core `isCompact`).
 * Hidden on home, builder, and records (theme-agnostic page path).
 */
export function BorderlessToggle() {
  const pathname = usePathname();
  const { borderless, setBorderless } = useBorderlessMode();
  const page = pagePathFromPathname(pathname);

  if (
    page === routes.home ||
    isActiveRoute(pathname, routes.builder) ||
    isActiveRoute(pathname, routes.records)
  ) {
    return null;
  }

  return (
    <Form.Check
      type="switch"
      id="borderless-questions"
      className="mb-0 text-nowrap"
      checked={borderless}
      onChange={(e) => setBorderless(e.target.checked)}
      label="Borderless questions"
    />
  );
}
