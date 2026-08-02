"use client";

import { useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import {
  insuranceClaimSchema,
  insuranceClaimSeed,
  type ClaimRecord,
  type SurveyData,
} from "@adapter/schemas";
import { SurveyForm } from "@/components/SurveyForm";

/** CRUD lifecycle off ONE schema: create / edit drive an edit-mode form,
 * read drives the same form in display mode. */
type EditorMode = "create" | "edit" | "view";

interface Editor {
  readonly mode: EditorMode;
  /** null for `create` (empty form). */
  readonly record: ClaimRecord | null;
  /** Bumps to force a fresh SurveyJS model per session. */
  readonly key: number;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type ChipColor = "default" | "info" | "warning" | "success" | "error";

const STATUS_COLOR: Record<string, ChipColor> = {
  draft: "default",
  submitted: "info",
  in_review: "warning",
  approved: "success",
  denied: "error",
};

function statusLabel(status: unknown): string {
  return String(status ?? "").replace(/_/g, " ") || "—";
}

function claimantName(data: SurveyData): string {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  return name || "—";
}

/**
 * Records — CRUD over the insurance-claim entity. The list is a native MUI
 * `<Table>`; SurveyJS owns ONLY the form on the right, rendered through the same
 * MUI adapter as every other page. Create/edit/delete mutate the in-memory
 * `records` state (seeded from `@adapter/schemas`), and all four lifecycle
 * operations run off the single `insuranceClaimSchema`.
 */
export default function RecordsPage() {
  const [records, setRecords] = useState<ClaimRecord[]>(() =>
    insuranceClaimSeed.map((r) => ({ ...r, data: { ...r.data } })),
  );
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClaimRecord | null>(null);

  const open = useCallback(
    (mode: EditorMode, record: ClaimRecord | null) =>
      setEditor((prev) => ({ mode, record, key: (prev?.key ?? 0) + 1 })),
    [],
  );

  const handleComplete = useCallback(
    (data: SurveyData) => {
      const saved: SurveyData = { ...data };
      setRecords((prev) => {
        if (editor?.mode === "edit" && editor.record) {
          const id = editor.record.id;
          return prev.map((r) => (r.id === id ? { id, data: saved } : r));
        }
        // create — derive a stable id from the claim number, else generate one.
        const fromField = String(saved.claimNumber ?? "").trim();
        const id =
          fromField || `CLM-2026-${String(prev.length + 1).padStart(4, "0")}`;
        return [...prev, { id, data: { ...saved, claimNumber: id } }];
      });
      // Reflect the saved record back in read mode as confirmation.
      const fromField = String(saved.claimNumber ?? "").trim();
      const id =
        editor?.mode === "edit" && editor.record
          ? editor.record.id
          : fromField || `CLM-2026-${String(records.length + 1).padStart(4, "0")}`;
      setEditor((prev) => ({
        mode: "view",
        record: { id, data: { ...saved, claimNumber: id } },
        key: (prev?.key ?? 0) + 1,
      }));
    },
    [editor, records.length],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setEditor((prev) => (prev?.record?.id === deleteTarget.id ? null : prev));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const editorTitle = useMemo(() => {
    if (!editor) return "Form";
    if (editor.mode === "create") return "New claim";
    if (editor.mode === "edit") return `Edit ${editor.record?.id ?? ""}`;
    return `View ${editor.record?.id ?? ""}`;
  }, [editor]);

  return (
    <Box>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => open("create", null)}
        >
          New claim
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 4,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
        }}
      >
        {/* Native MUI data table — SurveyJS is NOT involved here. */}
        <Card variant="outlined">
          <TableContainer>
            <Table sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Claim #</TableCell>
                  <TableCell>Claimant</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        No records. Create a new claim to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {records.map((record) => {
                  const active = editor?.record?.id === record.id;
                  return (
                    <TableRow
                      key={record.id}
                      hover
                      selected={active}
                    >
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {record.id}
                      </TableCell>
                      <TableCell>{claimantName(record.data)}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {String(record.data.claimType ?? "—")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={STATUS_COLOR[String(record.data.status)] ?? "default"}
                          label={statusLabel(record.data.status)}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {typeof record.data.amountClaimed === "number"
                          ? currency.format(record.data.amountClaimed)
                          : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => open("view", record)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            onClick={() => open("edit", record)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(record)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* SurveyJS owns ONLY this form. One schema, four lifecycle modes. */}
        <Box sx={{ position: { lg: "sticky" }, top: { lg: "5rem" } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {editorTitle}
            </Typography>
            {editor ? (
              <Stack direction="row" spacing={1}>
                {editor.mode === "view" && editor.record && (
                  <Button
                    size="small"
                    onClick={() => open("edit", editor.record)}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setEditor(null)}
                >
                  Close
                </Button>
              </Stack>
            ) : null}
          </Stack>
          {editor ? (
            <SurveyForm
              key={editor.key}
              schema={insuranceClaimSchema}
              data={editor.record?.data}
              mode={editor.mode === "view" ? "display" : "edit"}
              onComplete={editor.mode === "view" ? undefined : handleComplete}
            />
          ) : (
            <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
              <Typography
                color="text.secondary"
                align="center"
                sx={{ py: 6 }}
              >
                Select a record to view or edit, or create a new claim.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Native MUI confirm dialog for Delete. */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete claim?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently removes{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {deleteTarget?.id}
            </Box>
            {deleteTarget ? ` (${claimantName(deleteTarget.data)})` : ""}. This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
