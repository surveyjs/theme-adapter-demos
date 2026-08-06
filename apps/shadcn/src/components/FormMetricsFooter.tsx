import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildFormMetricsHeading,
  buildFormMetricsNativeLabel,
  buildFormMetricsRows,
  buildFormMetricsScope,
  FORM_METRICS_CAPTION,
  FORM_METRICS_SURVEYJS_LABEL,
} from "@adapter/schemas";
import { FORM_METRICS } from "@/content/formMetrics";

/**
 * "Code cost" comparison footer rendered ONCE below both /claims columns.
 *
 * Pure presentational host chrome — no SurveyJS involvement. It folds the two
 * forms' metrics into a single side-by-side table (SurveyJS vs Native shadcn/ui)
 * so the demo's thesis reads at a glance: SurveyJS reaches the same form with a
 * tiny, reusable renderer driving a visually-authored JSON schema, while the
 * native column needs a large block of form-specific code a developer rewrites
 * for every form.
 *
 * Rendered as a native <details>/<summary> disclosure — OPEN on first render,
 * with the summary still working as a collapse control — so it needs no client
 * JS and stays a server component. This is a footer at the bottom of the page,
 * not a per-route page header, so it does not violate the "no page header"
 * invariant.
 *
 * Copy is shared across all apps via `@adapter/schemas`; the numbers come from
 * `@/content/formMetrics` (this app's single source of truth) and NOTHING here
 * is hardcoded. This component owns only the shadcn markup.
 */

export function FormMetricsFooter() {
  const rows = buildFormMetricsRows(FORM_METRICS);
  const scope = buildFormMetricsScope(FORM_METRICS);

  return (
    <details className="mt-2 rounded-xl border bg-card p-4" open>
      <summary className="text-muted-foreground cursor-pointer text-sm font-semibold">
        {buildFormMetricsHeading(FORM_METRICS)}
      </summary>

      <p className="text-muted-foreground mt-2 text-xs">
        {scope.text} {scope.filesLabel}{" "}
        {scope.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 && " · "}
            <a
              className="underline underline-offset-2"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </span>
        ))}
      </p>

      <Table className="mt-4 text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4" />
            <TableHead className="bg-primary/10 text-foreground font-semibold">
              {FORM_METRICS_SURVEYJS_LABEL}
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              {buildFormMetricsNativeLabel(FORM_METRICS)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            // The final row is a volunteered footnote, not part of the
            // comparison proper — smaller and dimmer, no icon or background.
            <TableRow key={row.label} className={row.muted ? "text-xs opacity-70" : undefined}>
              <TableCell className="text-muted-foreground align-top font-medium whitespace-normal">
                {row.label}
              </TableCell>
              <TableCell
                className={
                  row.muted
                    ? "bg-primary/5 text-muted-foreground align-top whitespace-normal"
                    : "bg-primary/5 text-foreground align-top whitespace-normal"
                }
              >
                {row.surveyjs}
              </TableCell>
              <TableCell className="text-muted-foreground align-top whitespace-normal">
                {row.native}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-muted-foreground mt-4 text-sm italic">
        {FORM_METRICS_CAPTION}
      </p>
    </details>
  );
}
