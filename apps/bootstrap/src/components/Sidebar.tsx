"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "react-bootstrap";
import {
  isActiveRoute,
  navItems,
  themeFromPathname,
  themedPath,
} from "@adapter/schemas";
import { DEFAULT_THEME, isColorThemeId } from "@/lib/themes";

/**
 * Sidebar navigation. Paths are theme-prefixed (`/<theme>/<page>`).
 */
export function Sidebar() {
  const pathname = usePathname();
  const themeSegment = themeFromPathname(pathname);
  const theme = isColorThemeId(themeSegment) ? themeSegment : DEFAULT_THEME;

  return (
    <Nav className="flex-column p-3 gap-1" as="nav" aria-label="Primary">
      {navItems.map((item) => {
        const href = themedPath(theme, item.path);
        const active = isActiveRoute(pathname, item.path);
        return (
          <Nav.Link
            key={item.id}
            as={Link}
            href={href}
            active={active}
            aria-current={active ? "page" : undefined}
            className="rounded px-3 py-2"
          >
            <span className="fw-medium">{item.label}</span>
            <small className="d-block text-body-secondary">
              {item.description}
            </small>
          </Nav.Link>
        );
      })}
    </Nav>
  );
}
