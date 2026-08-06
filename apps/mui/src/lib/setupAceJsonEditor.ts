/**
 * Ace is optional for Survey Creator's JSON Editor. Without it Creator falls
 * back to a plain textarea; without clouds_midnight + preferredColorPalette
 * "dark", Ace stays on a light theme even when the host app is dark.
 *
 * Import from BuilderCreator (client-only) before constructing SurveyCreator so
 * `window.ace` exists for TabJsonEditorAcePlugin.hasAceEditor().
 */

import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/theme-clouds_midnight";
import "ace-builds/src-noconflict/mode-json";
import { AceJsonEditorModel } from "survey-creator-core";
import type { SurveyCreator } from "survey-creator-react";

AceJsonEditorModel.aceBasePath = "https://unpkg.com/ace-builds/src-min-noconflict/";

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

export function syncCreatorAcePalette(creator: SurveyCreator): void {
  const next = readPreferredColorPalette();
  if (creator.preferredColorPalette === next) return;
  creator.preferredColorPalette = next;
  // Ace applies clouds_midnight only in onPluginActivate — re-run it if the
  // JSON tab is already open so a live light/dark toggle updates the editor.
  if (creator.activeTab === "json") {
    const plugin = creator.getPlugin("json", false) as { model?: { onPluginActivate?: () => void } } | undefined;
    plugin?.model?.onPluginActivate?.();
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
