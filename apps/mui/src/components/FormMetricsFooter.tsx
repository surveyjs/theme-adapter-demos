import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
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
 * forms' metrics into a single side-by-side table (SurveyJS vs Native MUI) so
 * the demo's thesis reads at a glance: SurveyJS reaches the same form with a
 * tiny, reusable renderer driving a visually-authored JSON schema, while the
 * native column needs a large block of form-specific code a developer rewrites
 * for every form.
 *
 * Rendered as a native <details>/<summary> disclosure (via `Box component="details"`)
 * — OPEN on first render, with the summary still working as a collapse control —
 * so it needs no client JS and stays a server component (an MUI <Accordion> would
 * pull in a "use client" boundary). This is a footer at the bottom of the page,
 * not a per-route page header, so it does not violate the "no page header"
 * invariant.
 *
 * Copy is shared across all apps via `@adapter/schemas`; the numbers come from
 * `@/content/formMetrics` (this app's single source of truth) and NOTHING here
 * is hardcoded. This component owns only the MUI markup.
 */

export function FormMetricsFooter() {
  const rows = buildFormMetricsRows(FORM_METRICS);
  const scope = buildFormMetricsScope(FORM_METRICS);

  return (
    // `pb` (not `mb`) so the closing caption always keeps clear of the page
    // bottom — margins here can collapse into the page grid.
    <Box component="details" open sx={{ mt: 1, pb: 4 }}>
      <Box
        component="summary"
        sx={{
          cursor: "pointer",
          color: "text.secondary",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {buildFormMetricsHeading(FORM_METRICS)}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {scope.text}{" "}
        {scope.filesLabel}{" "}
        {scope.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 && " · "}
            <Link href={link.href} target="_blank" rel="noopener noreferrer" color="inherit">
              {link.label}
            </Link>
          </span>
        ))}
      </Typography>

      <TableContainer sx={{ mt: 2, mb: 2 }}>
        <Table size="small" sx={{ color: "text.secondary" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "25%", color: "text.secondary" }} />
              <TableCell sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 600 }}>
                {FORM_METRICS_SURVEYJS_LABEL}
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                {buildFormMetricsNativeLabel(FORM_METRICS)}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              // The final row is a volunteered footnote, not part of the
              // comparison proper — dimmer, but the SAME type size as the rows
              // above. No icon, no coloured background.
              <TableRow key={row.label} sx={row.muted ? { opacity: 0.6 } : undefined}>
                <TableCell component="th" scope="row" sx={{ color: "text.secondary" }}>
                  {row.label}
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "action.hover",
                    color: row.muted ? "text.secondary" : "text.primary",
                  }}
                >
                  {row.surveyjs}
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{row.native}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontStyle: "italic", mb: 0 }}
      >
        {FORM_METRICS_CAPTION}
      </Typography>
    </Box>
  );
}
