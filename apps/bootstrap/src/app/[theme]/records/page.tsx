"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, ButtonGroup, Card, Modal, Table } from "react-bootstrap";
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

const STATUS_VARIANT: Record<string, string> = {
  draft: "secondary",
  submitted: "info",
  in_review: "warning",
  approved: "success",
  denied: "danger",
};

function statusLabel(status: unknown): string {
  return String(status ?? "").replace(/_/g, " ") || "—";
}

function claimantName(data: SurveyData): string {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  return name || "—";
}

/**
 * Records — CRUD over the insurance-claim entity. The list is a native
 * react-bootstrap `<Table>`; SurveyJS owns ONLY the form on the right, rendered
 * through the same Bootstrap adapter as every other page. Create/edit/delete
 * mutate the in-memory `records` state (seeded from `@adapter/schemas`), and all
 * four lifecycle operations run off the single `insuranceClaimSchema`.
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
          fromField ||
          `CLM-2026-${String(prev.length + 1).padStart(4, "0")}`;
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
    if (!editor) return "";
    if (editor.mode === "create") return "New claim";
    if (editor.mode === "edit") return `Edit ${editor.record?.id ?? ""}`;
    return `View ${editor.record?.id ?? ""}`;
  }, [editor]);

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <Button variant="primary" onClick={() => open("create", null)}>
          + New claim
        </Button>
      </div>

      <div className="row g-4">
        {/* Native Bootstrap data table — SurveyJS is NOT involved here. */}
        <div className="col-12 col-xl-7">
          <Card>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col">Claim #</th>
                    <th scope="col">Claimant</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">
                      Amount
                    </th>
                    <th scope="col" className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-body-secondary py-4">
                        No records. Create a new claim to get started.
                      </td>
                    </tr>
                  )}
                  {records.map((record) => {
                    const active = editor?.record?.id === record.id;
                    return (
                      <tr
                        key={record.id}
                        className={active ? "table-active" : undefined}
                      >
                        <td className="font-monospace">{record.id}</td>
                        <td>{claimantName(record.data)}</td>
                        <td className="text-capitalize">
                          {String(record.data.claimType ?? "—")}
                        </td>
                        <td>
                          <Badge
                            bg={STATUS_VARIANT[String(record.data.status)] ?? "secondary"}
                            className="text-capitalize"
                          >
                            {statusLabel(record.data.status)}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {typeof record.data.amountClaimed === "number"
                            ? currency.format(record.data.amountClaimed)
                            : "—"}
                        </td>
                        <td className="text-end">
                          <ButtonGroup size="sm">
                            <Button
                              variant="outline-secondary"
                              onClick={() => open("view", record)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-primary"
                              onClick={() => open("edit", record)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => setDeleteTarget(record)}
                            >
                              Delete
                            </Button>
                          </ButtonGroup>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>

        {/* SurveyJS owns ONLY this form. One schema, four lifecycle modes. */}
        <div className="col-12 col-xl-5">
          <div className="position-sticky" style={{ top: "5rem" }}>
            <Card>
              <Card.Header className="d-flex align-items-center justify-content-between gap-2">
                <span className="fw-medium">{editor ? editorTitle : "Form"}</span>
                {editor && (
                  <div className="d-flex gap-2">
                    {editor.mode === "view" && editor.record && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => open("edit", editor.record)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setEditor(null)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                {editor ? (
                  <SurveyForm
                    key={editor.key}
                    schema={insuranceClaimSchema}
                    data={editor.record?.data}
                    mode={editor.mode === "view" ? "display" : "edit"}
                    onComplete={
                      editor.mode === "view" ? undefined : handleComplete
                    }
                  />
                ) : (
                  <p className="text-body-secondary text-center py-5 mb-0">
                    Select a record to view or edit, or create a new claim.
                  </p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Native react-bootstrap confirm modal for Delete. */}
      <Modal show={deleteTarget !== null} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">Delete claim?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This permanently removes{" "}
          <span className="font-monospace">{deleteTarget?.id}</span>
          {deleteTarget ? ` (${claimantName(deleteTarget.data)})` : ""}. This
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
