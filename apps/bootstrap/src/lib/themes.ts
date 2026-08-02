/**
 * App-local theme catalog for the Bootstrap shell chrome.
 *
 * Theme selection lives in the URL (`/<theme>/<page>`). Light/dark mode stays a
 * separate axis via `data-bs-theme` on <html> (localStorage).
 *
 * Each theme is paired with a dedicated SurveyJS adapter bundle (`bootstrap-<id>`).
 * Chrome + adapter + overrides sheets are linked statically from `[theme]/layout`
 * — no runtime <link> swapping.
 */

export type ColorThemeId =
  | "default"
  | "zephyr"
  | "cosmo"
  | "morph"
  | "flatly"
  | "darkly"
  | "lux"
  | "litera";
export type ColorMode = "light" | "dark";

export interface ColorTheme {
  readonly id: ColorThemeId;
  readonly label: string;
  /** One-line flavor text for the dropdown. */
  readonly description: string;
}

export const colorThemes: readonly ColorTheme[] = [
  { id: "default", label: "Bootstrap", description: "Stock Bootstrap 5 palette." },
  { id: "flatly", label: "Flatly", description: "Flat, friendly teal." },
  { id: "darkly", label: "Darkly", description: "Bold dark slate." },
  { id: "cosmo", label: "Cosmo", description: "Flat, ordered ocean blue." },
  { id: "litera", label: "Litera", description: "Clean, readable neutral." },
  { id: "lux", label: "Lux", description: "Minimal, premium serif." },
  { id: "zephyr", label: "Zephyr", description: "Crisp, modern blue." },
  { id: "morph", label: "Morph", description: "Soft neumorphic purple." },
] as const;

export const DEFAULT_THEME: ColorThemeId = "default";
export const DEFAULT_MODE: ColorMode = "light";

export const MODE_STORAGE_KEY = "adapter:mode";

const themeIds = colorThemes.map((t) => t.id);

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === "string" && (themeIds as string[]).includes(value);
}

export function isColorMode(value: unknown): value is ColorMode {
  return value === "light" || value === "dark";
}

export function themeHref(id: ColorThemeId): string {
  return `/themes/${id}.css`;
}

export function surveyAdapterHref(id: ColorThemeId): string {
  return `/survey-adapters/${id}.css`;
}

export const SURVEY_OVERRIDES_SHARED_HREF = "/survey-overrides/bootstrap.css";

export function surveyOverridesHref(id: ColorThemeId): string {
  return `/survey-overrides/${id}.css`;
}

/**
 * Pre-paint light/dark only. Theme CSS is linked statically from the route
 * layout — no localStorage theme, no dynamic <link> creation.
 */
export function modeBootstrapScript(): string {
  return `(function(){try{
var m=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});
if(m!=="light"&&m!=="dark")m=${JSON.stringify(DEFAULT_MODE)};
document.documentElement.setAttribute("data-bs-theme",m);
}catch(e){}})();`;
}
