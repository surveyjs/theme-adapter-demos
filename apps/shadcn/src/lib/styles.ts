/**
 * Visual-style registry — the shadcn analog of Bootswatch themes / MUI palettes.
 *
 * Style selection lives in the URL (`/<style>/<page>`). Other axes (base color,
 * accent, radius, light/dark) stay client-side.
 */
export const VISUAL_STYLES = [
  { id: "default", label: "Default" },
  { id: "new-york", label: "New York" },
  { id: "base-nova", label: "Base Nova" },
  { id: "base-vega", label: "Base Vega" },
  { id: "base-maia", label: "Base Maia" },
  { id: "base-lyra", label: "Base Lyra" },
  { id: "base-mira", label: "Base Mira" },
  { id: "base-luma", label: "Base Luma" },
  { id: "base-sera", label: "Base Sera" },
  { id: "base-rhea", label: "Base Rhea" },
] as const;

export type VisualStyleId = (typeof VISUAL_STYLES)[number]["id"];

export const DEFAULT_STYLE_ID: VisualStyleId = "default";

export function isVisualStyleId(value: string | null | undefined): value is VisualStyleId {
  return value != null && VISUAL_STYLES.some((style) => style.id === value);
}
