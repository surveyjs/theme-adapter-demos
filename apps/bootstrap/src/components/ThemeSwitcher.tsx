"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button, Dropdown, ButtonGroup } from "react-bootstrap";
import {
  pagePathFromPathname,
  themeFromPathname,
  themedPath,
} from "@adapter/schemas";
import {
  colorThemes,
  DEFAULT_THEME,
  isColorThemeId,
  type ColorThemeId,
} from "@/lib/themes";
import { useTheme } from "./ThemeProvider";
import "./ThemeSwitcher.css";

/**
 * Header theme controls:
 *  - light/dark toggle (`data-bs-theme` on <html>)
 *  - color-theme dropdown → navigates to `/<theme>/<current-page>`
 */
export function ThemeSwitcher() {
  const { mode, toggleMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const themeSegment = themeFromPathname(pathname);
  const theme: ColorThemeId = isColorThemeId(themeSegment)
    ? themeSegment
    : DEFAULT_THEME;
  const activeLabel =
    colorThemes.find((t) => t.id === theme)?.label ?? "Theme";

  const selectTheme = (next: ColorThemeId) => {
    if (next === theme) return;
    router.push(themedPath(next, pagePathFromPathname(pathname)));
  };

  return (
    <ButtonGroup className="theme-switcher">
      <Dropdown as={ButtonGroup} align="end">
        <Dropdown.Toggle variant="outline-secondary" id="theme-dropdown">
          <span className="me-1">🎨</span>
          {activeLabel}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Header>Color theme</Dropdown.Header>
          {colorThemes.map((t) => (
            <Dropdown.Item
              key={t.id}
              active={t.id === theme}
              onClick={() => selectTheme(t.id)}
            >
              <div className="fw-medium">{t.label}</div>
              <small className="opacity-75">{t.description}</small>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <Button
        variant="outline-secondary"
        onClick={toggleMode}
        title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      >
        {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
      </Button>
    </ButtonGroup>
  );
}
