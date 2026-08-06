/**
 * "Code cost" comparison footer rendered ONCE below both /claims columns.
 *
 * Pure presentational host chrome — no SurveyJS involvement. It folds the two
 * forms' metrics into a single side-by-side table (SurveyJS vs Native Bootstrap)
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
 * is hardcoded. This component owns only the Bootstrap markup.
 */

import {
  buildFormMetricsHeading,
  buildFormMetricsNativeLabel,
  buildFormMetricsRows,
  buildFormMetricsScope,
  FORM_METRICS_CAPTION,
  FORM_METRICS_SURVEYJS_LABEL,
} from "@adapter/schemas";
import { FORM_METRICS } from "@/content/formMetrics";

export function FormMetricsFooter() {
  const rows = buildFormMetricsRows(FORM_METRICS);
  const scope = buildFormMetricsScope(FORM_METRICS);

  return (
    // `pb-4` (not a margin) so the closing caption always keeps clear of the
    // page bottom — margins here can collapse into the page grid.
    <details className="mt-2 pb-4" open>
      <summary
        className="text-body-secondary small fw-semibold"
        style={{ cursor: "pointer" }}
      >
        {buildFormMetricsHeading(FORM_METRICS)}
      </summary>

      <p className="text-body-secondary mt-2 mb-0" style={{ fontSize: "0.75rem" }}>
        {scope.text} {scope.filesLabel}{" "}
        {scope.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 && " · "}
            <a
              className="link-secondary"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </span>
        ))}
      </p>

      <table className="table table-sm align-middle small mb-2 mt-2">
        <thead>
          <tr>
            <th scope="col" className="w-25 fw-normal text-body-secondary">
              &nbsp;
            </th>
            <th scope="col" className="table-primary">
              {FORM_METRICS_SURVEYJS_LABEL}
            </th>
            <th scope="col">{buildFormMetricsNativeLabel(FORM_METRICS)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            // The final row is a volunteered footnote, not part of the
            // comparison proper — dimmer, but the SAME type size as the rows
            // above. No icon, no coloured background.
            <tr
              key={row.label}
              className={row.muted ? "text-body-secondary" : undefined}
              style={row.muted ? { opacity: 0.6 } : undefined}
            >
              <th scope="row" className="fw-normal text-body-secondary">
                {row.label}
              </th>
              <td className="table-primary">{row.surveyjs}</td>
              <td>{row.native}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-body-secondary small fst-italic mb-0">
        {FORM_METRICS_CAPTION}
      </p>
    </details>
  );
}
