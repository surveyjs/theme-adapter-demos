/**
 * Ace is optional for Survey Creator's JSON Editor. Without it Creator falls
 * back to a plain textarea; without clouds_midnight + preferredColorPalette
 * "dark", Ace stays on a light theme even when the host app is dark.
 *
 * Import from BuilderCreator (client-only) before constructing SurveyCreator so
 * `window.ace` exists for TabJsonEditorAcePlugin.hasAceEditor().
 *
 * Creator's AceJsonEditorModel only *sets* clouds_midnight for dark and never
 * clears it for light — so we apply Ace themes ourselves on host mode changes
 * while the JSON tab is open.
 */

import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/theme-clouds_midnight";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/mode-json";
import { AceJsonEditorModel } from "survey-creator-core";
import type { SurveyCreator } from "survey-creator-react";

AceJsonEditorModel.aceBasePath = "https://unpkg.com/ace-builds/src-min-noconflict/";

const ACE_THEME_DARK = "ace/theme/clouds_midnight";
const ACE_THEME_LIGHT = "ace/theme/chrome";

if (typeof window !== "undefined") {
  (window as unknown as { ace: typeof ace }).ace = ace;
}

function isDarkRgb(color: string): boolean {
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return false;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

/** Resolve Creator Ace palette from host dark-mode signals + body background. */
export function readPreferredColorPalette(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.getAttribute("data-bs-theme") === "dark") return "dark";
  if (root.getAttribute("data-mui-color-scheme") === "dark") return "dark";
  if (getComputedStyle(root).colorScheme === "dark") return "dark";
  return isDarkRgb(getComputedStyle(document.body).backgroundColor) ? "dark" : "light";
}

function applyAceTheme(palette: "light" | "dark"): void {
  const host = document.querySelector(".svc-json-editor-tab__ace-editor") as HTMLElement | null;
  if (!host || typeof window === "undefined" || !(window as unknown as { ace?: typeof ace }).ace) {
    return;
  }
  // ace.edit(el) returns the existing editor instance for a mounted host.
  const editor = (window as unknown as { ace: typeof ace }).ace.edit(host);
  editor.setTheme(palette === "dark" ? ACE_THEME_DARK : ACE_THEME_LIGHT);
}

export function syncCreatorAcePalette(creator: SurveyCreator): void {
  const next = readPreferredColorPalette();
  const changed = creator.preferredColorPalette !== next;
  if (changed) {
    creator.preferredColorPalette = next;
  }
  // Always push the Ace theme while the JSON tab is visible — Creator only
  // sets clouds_midnight for dark and never restores a light theme.
  if (creator.activeTab === "json") {
    applyAceTheme(next);
  }
}

/** Keep Ace's dark/light theme aligned when the host toggles color mode. */
export function observeCreatorAcePalette(creator: SurveyCreator): () => void {
  syncCreatorAcePalette(creator);
  const sync = () => syncCreatorAcePalette(creator);
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-bs-theme", "data-mui-color-scheme", "style"],
  });
  return () => observer.disconnect();
}
