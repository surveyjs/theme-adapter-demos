/**
 * Shared information architecture: routes + nav items.
 *
 * Apps render their navigation FROM this list so the IA is identical across the
 * Bootstrap / shadcn / MUI hosts. Apps must not redefine routes locally.
 *
 * Theme lives in the URL as the first segment (`/<theme>/<page>`). `routes` and
 * `navItems[].path` stay theme-agnostic page suffixes; apps prefix them with
 * `themedPath(theme, path)`.
 */

export type NavId =
  | "checkout"
  | "records"
  | "claims"
  | "builder"
  | "all-questions";

export interface NavItem {
  /** Stable id, also used as a React key. */
  readonly id: NavId;
  /** Display label in the nav. */
  readonly label: string;
  /** Theme-agnostic app route path (e.g. `/claims`). */
  readonly path: string;
  /** One-line description for landing cards / page intros. */
  readonly description: string;
  /** Optional id of the schema this route primarily renders. */
  readonly schemaId?: string;
}

export const navItems: readonly NavItem[] = [
  {
    id: "claims",
    label: "Claims",
    path: "/claims",
    description: "Patient intake / medical-insurance form.",
    schemaId: "medical-form",
  },
  {
    id: "checkout",
    label: "Checkout",
    path: "/checkout",
    description: "Multi-step checkout wizard.",
    schemaId: "checkout",
  },
  {
    id: "records",
    label: "Records",
    path: "/records",
    description: "Browse and edit insurance-claim records.",
    schemaId: "insurance-claim",
  },
  {
    id: "builder",
    label: "Builder",
    path: "/builder",
    description: "Edit schemas live with SurveyJS Creator.",
  },
  {
    id: "all-questions",
    label: "All Questions",
    path: "/all-questions",
    description: "Every question type, grouped by Creator toolbox category.",
    schemaId: "all-questions",
  },
] as const;

/** Theme-agnostic route path constants for type-safe comparisons / linking. */
export const routes = {
  home: "/",
  checkout: "/checkout",
  records: "/records",
  recordDetail: (id: string) => `/records/${id}`,
  claims: "/claims",
  builder: "/builder",
  allQuestions: "/all-questions",
} as const;

/**
 * Prefix a theme-agnostic page path with the active theme segment.
 * `/` → `/flatly`, `/claims` → `/flatly/claims`.
 */
export function themedPath(theme: string, path: string): string {
  if (path === "/" || path === "") return `/${theme}`;
  return `/${theme}${path.startsWith("/") ? path : `/${path}`}`;
}

/** First URL segment — the theme id (undefined on `/`). */
export function themeFromPathname(pathname: string): string | undefined {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment;
}

/**
 * Strip the theme segment from a pathname.
 * `/flatly/claims` → `/claims`, `/flatly` → `/`.
 */
export function pagePathFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "/";
  return `/${segments.slice(1).join("/")}`;
}

/** Whether `pathname` (with theme prefix) matches a theme-agnostic route. */
export function isActiveRoute(pathname: string, routePath: string): boolean {
  const page = pagePathFromPathname(pathname);
  if (routePath === "/") return page === "/";
  return page === routePath || page.startsWith(`${routePath}/`);
}

export function getNavItem(id: NavId): NavItem | undefined {
  return navItems.find((item) => item.id === id);
}
