/**
 * Single source of truth for the visual regression matrix.
 *
 * Mirrors the theme catalogs the apps themselves ship:
 *  - bootstrap: `apps/bootstrap/src/lib/themes.ts` (colorThemes)
 *  - shadcn:    `apps/shadcn/src/lib/styles.ts` (VISUAL_STYLES)
 *  - mui:       no theme in the URL — palettes are a client-side concern
 *
 * When a theme is added to an app, add its slug here too.
 */

export const PAGES = [
  "claims",
  "checkout",
  "records",
  "builder",
  "all-questions",
] as const;

export type PageId = (typeof PAGES)[number];

/** Light/dark axis, orthogonal to the theme axis in every app. */
export const COLOR_MODES = ["light", "dark"] as const;

export type ColorMode = (typeof COLOR_MODES)[number];

export interface AppConfig {
  readonly id: string;
  readonly port: number;
  readonly workspace: string;
  /** URL theme slugs; empty means the app has no `[theme]` segment. */
  readonly themes: readonly string[];
}

export const APPS: readonly AppConfig[] = [
  {
    id: "bootstrap",
    port: 3000,
    workspace: "@adapter/bootstrap",
    themes: [
      "default",
      "flatly",
      "darkly",
      "cosmo",
      "litera",
      "lux",
      "zephyr",
      "morph",
    ],
  },
  {
    id: "shadcn",
    port: 3001,
    workspace: "@adapter/shadcn",
    themes: [
      "base-nova",
      "base-vega",
      "base-maia",
      "base-lyra",
      "base-mira",
      "base-luma",
      "base-sera",
      "base-rhea",
      "default",
      "new-york",
    ],
  },
  {
    id: "mui",
    port: 3002,
    workspace: "@adapter/mui",
    themes: [],
  },
] as const;

export function getApp(id: string): AppConfig {
  const app = APPS.find((a) => a.id === id);
  if (!app) throw new Error(`Unknown app "${id}"`);
  return app;
}

export function baseUrl(app: AppConfig): string {
  return `http://localhost:${app.port}`;
}

/** Same shape as `themedPath` in @adapter/schemas: `/theme/page` or `/page`. */
export function routeFor(theme: string | null, page: PageId): string {
  return theme ? `/${theme}/${page}` : `/${page}`;
}

/** Themes to iterate; `[null]` for apps without a theme segment. */
export function themeMatrix(app: AppConfig): readonly (string | null)[] {
  return app.themes.length > 0 ? app.themes : [null];
}

/**
 * Apps the current run covers, narrowed by the `E2E_APPS` env var
 * (comma-separated ids, e.g. `E2E_APPS=bootstrap,mui`). Empty/unset means all.
 */
export function selectedApps(): readonly AppConfig[] {
  const raw = process.env.E2E_APPS?.trim();
  if (!raw) return APPS;

  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.map(getApp);
}
