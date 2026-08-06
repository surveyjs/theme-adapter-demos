/**
 * Shared content for the "code cost" comparison footer (`FormMetricsFooter`)
 * rendered below the /claims columns in every app.
 *
 * Renderer-agnostic: pure strings + builders, no SurveyJS and no host/CSS
 * framework. Each app owns only its own markup and supplies one config object
 * (see `FormMetricsInput`); every string below — heading, scope line and every
 * table cell — is derived from that single object, so the numbers cannot drift
 * between the three places they appear.
 */

/** Format a byte count as KB with one decimal, e.g. 4751 → "4.6 KB". */
export function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Column header for the SurveyJS side of the table. */
export const FORM_METRICS_SURVEYJS_LABEL = "SurveyJS";

/** Link label ending the scope line, followed by the two file links. */
export const FORM_METRICS_FILES_LABEL = "View both files →";

/** Italic caption rendered below the comparison table. */
export const FORM_METRICS_CAPTION =
  "You write the renderer once. After that, every new form and every change to " +
  "an existing one is data, not code — reviewed, deployed and owned " +
  "differently, however it was written.";

/**
 * The metrics for one app's Patient Intake comparison. This is the single
 * source of truth: each app declares it once (src/content/formMetrics.ts) and
 * the footer derives every visible string from it.
 */
export interface FormMetricsInput {
  /** Native framework label, e.g. "MUI" / "Bootstrap" / "shadcn/ui". */
  framework: string;
  /**
   * Non-empty, non-comment lines of the reusable SurveyJS renderer
   * (`SurveyForm.tsx`) — code only, the JSON schema is reported separately.
   */
  surveyjsLines: number;
  /**
   * Non-empty, non-comment lines of the hand-written native form
   * (`NativeControls.tsx`), counted by the same rules as `surveyjsLines`.
   */
  nativeLines: number;
  /** Byte size of the form's JSON schema (computed live, never hardcoded). */
  jsonBytes: number;
  /** GitHub URL of the counted SurveyJS renderer. */
  surveyjsFileUrl: string;
  /** GitHub URL of the counted native form component. */
  nativeFileUrl: string;
}

/** Trailing file name of a GitHub blob URL, for the scope-line link text. */
export function fileNameFromUrl(url: string): string {
  return url.split("/").pop() ?? url;
}

/** Header for the native column, e.g. "Native shadcn/ui". */
export function buildFormMetricsNativeLabel({ framework }: FormMetricsInput): string {
  return `Native ${framework}`;
}

/** Disclosure heading, e.g. "87 lines vs 583 — the same form, built two ways". */
export function buildFormMetricsHeading({
  surveyjsLines,
  nativeLines,
}: FormMetricsInput): string {
  return `${surveyjsLines} lines vs ${nativeLines} — the same form, built two ways`;
}

/**
 * Muted scope line between the heading and the table. Returned as text + link
 * parts so each app can render the links with its own anchor styling.
 */
export function buildFormMetricsScope(input: FormMetricsInput): {
  text: string;
  filesLabel: string;
  links: { label: string; href: string }[];
} {
  return {
    text:
      "Both columns render the Patient Intake form above. Counts are component " +
      `code only — the SurveyJS column's ${formatKB(input.jsonBytes)} JSON ` +
      "schema is listed separately below.",
    filesLabel: FORM_METRICS_FILES_LABEL,
    links: [
      { label: fileNameFromUrl(input.surveyjsFileUrl), href: input.surveyjsFileUrl },
      { label: fileNameFromUrl(input.nativeFileUrl), href: input.nativeFileUrl },
    ],
  };
}

/** One comparison row: a label and the SurveyJS vs native cell text. */
export interface FormMetricsRow {
  label: string;
  surveyjs: string;
  native: string;
  /**
   * Rendered lighter/smaller than the rows above, so it reads as a volunteered
   * footnote rather than part of the comparison proper.
   */
  muted?: boolean;
}

/**
 * Build the comparison rows. Row order is deliberate — the cost row comes last,
 * as a footnote — so do not reorder.
 */
export function buildFormMetricsRows({
  framework,
  surveyjsLines,
  nativeLines,
  jsonBytes,
}: FormMetricsInput): FormMetricsRow[] {
  return [
    {
      label: "Code you write & maintain",
      surveyjs:
        `${surveyjsLines} lines — a reusable renderer, not tied to this form. ` +
        "Form Library is MIT-licensed",
      native: `${nativeLines} lines — specific to this one form`,
    },
    {
      label: "Form definition",
      surveyjs: `A ${formatKB(jsonBytes)} JSON schema`,
      native: "None — the form only exists as code",
    },
    {
      label: "Cost of the next form",
      surveyjs: "Another JSON schema; the renderer is reused as-is",
      native: "Hand-write a comparable block again",
    },
    {
      label: "Changing the form later",
      surveyjs:
        "Edit the JSON — usually stored in a database, so no rebuild or redeploy",
      native: "Change the code, then rebuild and redeploy",
    },
    {
      label: "Who can build and edit it",
      surveyjs:
        "Non-developers, visually, in SurveyJS Creator — white-labeled into your app",
      native: `Not possible — there is no ${framework} form builder to embed`,
    },
    {
      label: "What it costs you",
      surveyjs: "A schema format to learn; Creator is commercially licensed",
      native: "Nothing extra — full control over every line",
      muted: true,
    },
  ];
}
