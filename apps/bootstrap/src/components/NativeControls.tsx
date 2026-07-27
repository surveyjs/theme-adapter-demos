"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { medicalFormJson, medicalFormSample } from "@adapter/schemas";
import { Trash } from 'react-bootstrap-icons';
import { FormCompleted } from "./FormCompleted";
import "./NativeControls.css";

/**
 * Hand-built react-bootstrap twin of the SurveyJS medical-intake form
 * (`medicalFormJson` in @adapter/schemas), grouped into the SAME four sections —
 * Patient, Insurance, History, Consent — and PAGED into them as a wizard to
 * match the SurveyJS form's `showProgressBar` / `progressBarType: "pages"`.
 *
 * Mirrors the SAME chrome (the survey title + description) and the SAME
 * behaviours: controlled inputs, per-page required-field validation that blocks
 * Next, a conditional secondary-insurance section, dynamic add/remove allergy
 * rows, a drawable signature pad, and a final Complete that validates the whole
 * form and shows a success state.
 *
 * This column is deliberately UNBRIDGED: it is the "what you'd hand-write per
 * form" baseline the comparison footer measures against (see FormMetricsFooter).
 * SurveyJS pages from the JSON for free; here every step is wired by hand — that
 * gap is the point. Pure host chrome — react-bootstrap only, zero SurveyJS
 * involvement (the imported `medicalFormJson` is read only for its description
 * string, so the two columns share the exact same wording).
 *
 * Its line count is cited by the comparison footer — measured in claims/page.tsx
 * (a server component) rather than exported from here, because a plain value
 * exported from a "use client" module can't be read on the server.
 */

type Sex = "f" | "m" | "";
type Relationship = "self" | "spouse" | "dependent";
type HistoryAnswer = "yes" | "no" | "unsure";

type Allergy = { allergen: string; severity: string; reaction: string };

const PAGES = ["Patient", "Insurance", "History", "Consent"] as const;
const LAST_PAGE = PAGES.length - 1;

const HISTORY_ROWS = [
  { value: "diabetes", text: "Diabetes" },
  { value: "hypertension", text: "High blood pressure" },
  { value: "asthma", text: "Asthma" },
  { value: "heart", text: "Heart disease" },
] as const;

/** Mask a raw phone string into the +1 (999) 999-9999 pattern. */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);
  let out = "+1";
  if (area) out += ` (${area}`;
  if (area.length === 3) out += ")";
  if (prefix) out += ` ${prefix}`;
  if (line) out += `-${line}`;
  return out;
}

export function NativeControls() {
  // Wizard paging — render ONE section at a time (Patient → … → Consent).
  const [currentPage, setCurrentPage] = useState(0);
  const [attempted, setAttempted] = useState([false, false, false, false]);

  // Patient
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<Sex>("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState("");

  // Insurance
  const [carrier, setCarrier] = useState("");
  const [memberId, setMemberId] = useState("");
  const [groupNumber, setGroupNumber] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("self");
  const [hasSecondary, setHasSecondary] = useState(false);
  const [carrier2, setCarrier2] = useState("");
  const [memberId2, setMemberId2] = useState("");

  // History
  const [history, setHistory] = useState<Record<string, HistoryAnswer>>({});
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [currentMedications, setCurrentMedications] = useState("");

  // Consent
  const [consentTreatment, setConsentTreatment] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [signedDate, setSignedDate] = useState("");

  const [submitted, setSubmitted] = useState(false);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function pointerPos(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startStroke(e: PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function moveStroke(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#212529";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endStroke() {
    drawing.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Dynamic allergy rows
  function addAllergy() {
    setAllergies((rows) => [...rows, { allergen: "", severity: "", reaction: "" }]);
  }
  function removeAllergy(index: number) {
    setAllergies((rows) => rows.filter((_, i) => i !== index));
  }
  function updateAllergy(index: number, field: keyof Allergy, value: string) {
    setAllergies((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  // Required-field validation — mirrors the SurveyJS schema's `isRequired` flags.
  const errors = {
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    dob: !dob,
    carrier: !carrier.trim(),
    memberId: !memberId.trim(),
    carrier2: hasSecondary && !carrier2.trim(),
    memberId2: hasSecondary && !memberId2.trim(),
    allergens: allergies.map((a) => !a.allergen.trim()),
    consentTreatment: !consentTreatment,
    consentPrivacy: !consentPrivacy,
  };

  // Which required fields belong to which wizard page.
  function isPageValid(page: number): boolean {
    switch (page) {
      case 0:
        return !errors.firstName && !errors.lastName && !errors.dob;
      case 1:
        return !errors.carrier && !errors.memberId && !errors.carrier2 && !errors.memberId2;
      case 2:
        return !errors.allergens.some(Boolean);
      case 3:
        return !errors.consentTreatment && !errors.consentPrivacy;
      default:
        return true;
    }
  }

  // Show inline errors on the current page only once it has been attempted
  // (Next/Complete pressed), so the user isn't yelled at before they act.
  const showErrors = attempted[currentPage];

  function markAttempted(page: number) {
    setAttempted((a) => (a[page] ? a : a.map((v, i) => (i === page ? true : v))));
  }

  function goBack() {
    setCurrentPage((p) => Math.max(0, p - 1));
  }

  function goNext() {
    markAttempted(currentPage);
    if (isPageValid(currentPage)) setCurrentPage((p) => Math.min(LAST_PAGE, p + 1));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted([true, true, true, true]);
    // By construction earlier pages were valid to reach here, but re-check the
    // whole form and jump back to the first offending page if anything changed.
    const firstInvalid = PAGES.findIndex((_, i) => !isPageValid(i));
    if (firstInvalid >= 0) {
      setCurrentPage(firstInvalid);
      return;
    }
    setSubmitted(true);
  }

  function resetForm() {
    setSubmitted(false);
    setCurrentPage(0);
    setAttempted([false, false, false, false]);
  }

  // "Prefill demo data" — the native twin of the SurveyJS column's custom
  // navigation button. Like SurveyJS, it fills only the CURRENT page; but where
  // SurveyJS narrows one shared object (medicalFormSample) to the page's fields
  // in a couple of generic lines, here every page needs its own hand-written
  // branch unpacking each field into its controlled state — another slice of the
  // per-form code the metrics footer is measuring.
  function prefillForm() {
    const s = medicalFormSample;
    switch (currentPage) {
      case 0:
        setFirstName(s.firstName as string);
        setLastName(s.lastName as string);
        setDob(s.dob as string);
        setSex(s.sex as Sex);
        setPhone(s.phone as string);
        setPreferredContact(s.preferredContact as string);
        break;
      case 1:
        setCarrier(s.carrier as string);
        setMemberId(s.memberId as string);
        setGroupNumber(s.groupNumber as string);
        setRelationship(s.relationshipToInsured as Relationship);
        setHasSecondary(s.hasSecondary as boolean);
        setCarrier2(s.carrier2 as string);
        setMemberId2(s.memberId2 as string);
        break;
      case 2:
        setHistory(s.medicalHistory as Record<string, HistoryAnswer>);
        setAllergies(s.allergies as Allergy[]);
        setCurrentMedications(s.currentMedications as string);
        break;
      case 3:
        setConsentTreatment(s.consentTreatment as boolean);
        setConsentPrivacy(s.consentPrivacy as boolean);
        setSignedDate(s.signedDate as string);
        break;
    }
  }

  if (submitted) {
    return (
      <FormCompleted
        message="Thank you. Your intake form has been submitted."
        onEdit={resetForm}
      />
    );
  }

  return (
    <Card>
      <Card.Body>
        {/* Survey title + description — mirrors the SurveyJS column's header,
            sharing the schema's exact description so only the "(…)" suffix
            differs between the two forms. */}
        <h2 className="mb-1">Patient Intake (Native Bootstrap)</h2>
        <p className="lead">
          {medicalFormJson.description as string}
        </p>

        {/* ── Wizard progress (mirrors SurveyJS progressBarType: "pages") ──
            A numbered-circle stepper — the structural twin of the SurveyJS
            "pages" progress bar and of the MUI column's <Stepper alternativeLabel>:
            circles joined by connectors with each page title centered below. */}
        <ol className="native-stepper">
          {PAGES.map((title, i) => {
            const state =
              i < currentPage ? "completed" : i === currentPage ? "active" : "upcoming";
            return (
              <li
                key={title}
                className="native-stepper__step"
                data-state={state}
                aria-current={i === currentPage ? "step" : undefined}
              >
                <span className="native-stepper__icon">{i + 1}</span>
                <span className="native-stepper__label">{title}</span>
              </li>
            );
          })}
        </ol>

        {/* Per-page title — the SurveyJS pages each carry a title, so the
            native wizard shows the active page's title too. */}
        <h3 className="mb-3">{PAGES[currentPage]}</h3>

        <Form noValidate onSubmit={handleSubmit}>
          {/* ── Patient ───────────────────────────────────────────── */}
          {currentPage === 0 && (
            <>
              <Row className="mb-3">
                <Form.Group as={Col} md={6} controlId="nf-first-name">
                  <Form.Label>First name</Form.Label>
                  <Form.Control
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    isInvalid={showErrors && errors.firstName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    First name is required.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md={6} controlId="nf-last-name">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    isInvalid={showErrors && errors.lastName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Last name is required.
                  </Form.Control.Feedback>
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} md={6} controlId="nf-dob">
                  <Form.Label>Date of birth</Form.Label>
                  <Form.Control
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    isInvalid={showErrors && errors.dob}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Date of birth is required.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md={6}>
                  <Form.Label className="d-block">Sex assigned at birth</Form.Label>
                  <Form.Check
                    inline
                    type="radio"
                    name="nf-sex"
                    id="nf-sex-f"
                    label="Female"
                    checked={sex === "f"}
                    onChange={() => setSex("f")}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="nf-sex"
                    id="nf-sex-m"
                    label="Male"
                    checked={sex === "m"}
                    onChange={() => setSex("m")}
                  />
                </Form.Group>
              </Row>

              <Row>
                <Form.Group as={Col} md={6} controlId="nf-phone">
                  <Form.Label>Mobile phone</Form.Label>
                  <Form.Control
                    type="tel"
                    inputMode="tel"
                    placeholder="+1 (___) ___-____"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                  />
                  <Form.Text muted>
                    We&apos;ll send appointment reminders to this number.
                  </Form.Text>
                </Form.Group>
                <Form.Group as={Col} md={6} controlId="nf-contact">
                  <Form.Label>Preferred contact method</Form.Label>
                  <Form.Select
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                  >
                    <option value="" disabled>
                      Select an option…
                    </option>
                    <option>Phone</option>
                    <option>Email</option>
                    <option>Text message</option>
                  </Form.Select>
                </Form.Group>
              </Row>
            </>
          )}

          {/* ── Insurance ─────────────────────────────────────────── */}
          {currentPage === 1 && (
            <>
              <Card body className="mb-3">
                <Card.Title>Primary insurance</Card.Title>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="nf-carrier">
                    <Form.Label>Insurance carrier</Form.Label>
                    <Form.Control
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      isInvalid={showErrors && errors.carrier}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Insurance carrier is required.
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="nf-member-id">
                    <Form.Label>Member ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      isInvalid={showErrors && errors.memberId}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Member ID is required.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="nf-group-number">
                    <Form.Label>Group number</Form.Label>
                    <Form.Control
                      type="text"
                      value={groupNumber}
                      onChange={(e) => setGroupNumber(e.target.value)}
                    />
                  </Form.Group>
                </Row>
                <Form.Group>
                  <Form.Label className="d-block">Patient is the…</Form.Label>
                  {(
                    [
                      ["self", "Policyholder"],
                      ["spouse", "Spouse"],
                      ["dependent", "Dependent"],
                    ] as const
                  ).map(([value, label]) => (
                    <Form.Check
                      key={value}
                      type="radio"
                      name="nf-relationship"
                      id={`nf-rel-${value}`}
                      label={label}
                      checked={relationship === value}
                      onChange={() => setRelationship(value)}
                    />
                  ))}
                </Form.Group>
              </Card>

              <Form.Check
                type="switch"
                id="nf-has-secondary"
                className="mb-3"
                label="Do you have secondary insurance?"
                checked={hasSecondary}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setHasSecondary(e.target.checked)
                }
              />

              {hasSecondary && (
                <Card body>
                  <Card.Title>Secondary insurance</Card.Title>
                  <Row>
                    <Form.Group as={Col} md={6} controlId="nf-carrier2">
                      <Form.Label>Insurance carrier</Form.Label>
                      <Form.Control
                        type="text"
                        value={carrier2}
                        onChange={(e) => setCarrier2(e.target.value)}
                        isInvalid={showErrors && errors.carrier2}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Insurance carrier is required.
                      </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} md={6} controlId="nf-member-id2">
                      <Form.Label>Member ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={memberId2}
                        onChange={(e) => setMemberId2(e.target.value)}
                        isInvalid={showErrors && errors.memberId2}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Member ID is required.
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Row>
                </Card>
              )}
            </>
          )}

          {/* ── History ───────────────────────────────────────────── */}
          {currentPage === 2 && (
            <>
            <Card body className="mb-3">
              <Form.Label className="d-block">
                Have you ever been diagnosed with any of the following?
              </Form.Label>
              <Table className="mb-4 align-middle">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col" className="text-center fw-normal">Yes</th>
                    <th scope="col" className="text-center fw-normal">No</th>
                    <th scope="col" className="text-center fw-normal">Unsure</th>
                  </tr>
                </thead>
                <tbody>
                  {HISTORY_ROWS.map((row) => (
                    <tr key={row.value}>
                      <th scope="row" className="fw-normal">{row.text}</th>
                      {(["yes", "no", "unsure"] as const).map((answer) => (
                        <td key={answer} className="text-center">
                          <Form.Check
                            type="radio"
                            name={`nf-history-${row.value}`}
                            id={`nf-history-${row.value}-${answer}`}
                            aria-label={`${row.text}: ${answer}`}
                            checked={history[row.value] === answer}
                            onChange={() =>
                              setHistory((h) => ({ ...h, [row.value]: answer }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              </Card>
              <Card body className="mb-3">
              <Form.Label className="d-block">Allergies</Form.Label>
              {allergies.length === 0 && (
                <div className="text-muted">No allergies added.</div>
              )}
              {allergies.length > 0 && (
                <Table className="mb-2 align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="text-center fw-normal">Allergen</th>
                      <th scope="col" className="text-center fw-normal" style={{ width: 140 }}>
                        Severity
                      </th>
                      <th scope="col" className="text-center fw-normal">Reaction</th>
                      <th scope="col" style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {allergies.map((allergy, index) => (
                      <tr key={index}>
                        <td>
                          <Form.Control
                            type="text"
                            placeholder="Allergen"
                            aria-label="Allergen"
                            value={allergy.allergen}
                            onChange={(e) => updateAllergy(index, "allergen", e.target.value)}
                            isInvalid={showErrors && errors.allergens[index]}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Allergen is required.
                          </Form.Control.Feedback>
                        </td>
                        <td>
                          <Form.Select
                            aria-label="Severity"
                            value={allergy.severity}
                            onChange={(e) => updateAllergy(index, "severity", e.target.value)}
                          >
                            <option value="" disabled>
                              Severity…
                            </option>
                            <option>Mild</option>
                            <option>Moderate</option>
                            <option>Severe</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            placeholder="Reaction"
                            aria-label="Reaction"
                            value={allergy.reaction}
                            onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
                          />
                        </td>
                        <td>
                          <Button
                            variant="light"
                            onClick={() => removeAllergy(index)}
                            aria-label={`Remove allergy ${index + 1}`}
                          >
                            <Trash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Button
                variant="light"
                size="sm"
                className="mb-4"
                onClick={addAllergy}
              >
                Add allergy
              </Button>
              </Card>
              <Form.Group controlId="nf-medications">
                <Form.Label>Current medications</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                />
              </Form.Group>

            </>
          )}

          {/* ── Consent ───────────────────────────────────────────── */}
          {currentPage === 3 && (
            <>
              <Form.Group className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="nf-consent-treatment"
                  label="I consent to treatment"
                  checked={consentTreatment}
                  onChange={(e) => setConsentTreatment(e.target.checked)}
                  isInvalid={showErrors && errors.consentTreatment}
                  feedback="Consent to treatment is required."
                  feedbackType="invalid"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="nf-consent-privacy"
                  label="I acknowledge the privacy practices (HIPAA)"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  isInvalid={showErrors && errors.consentPrivacy}
                  feedback="Acknowledgement is required."
                  feedbackType="invalid"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="d-block">Signature</Form.Label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={140}
                  className="border rounded w-100 bg-body"
                  style={{ touchAction: "none", cursor: "crosshair", maxWidth: "100%" }}
                  onPointerDown={startStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={endStroke}
                  onPointerLeave={endStroke}
                />
                <div>
                  <Button variant="link" size="sm" className="px-0" onClick={clearSignature}>
                    Clear signature
                  </Button>
                </div>
              </Form.Group>

              <Form.Group controlId="nf-signed-date">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          {/* ── Wizard navigation ─────────────────────────────────── */}
          <div className="d-flex gap-2 mt-4">
            {currentPage > 0 && (
              <Button variant="outline-primary" type="button" onClick={goBack}>
                Previous
              </Button>
            )}
            {currentPage < LAST_PAGE ? (
              <Button variant="outline-primary" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" variant="primary">
                Complete
              </Button>
            )}
            {/* Native twin of the SurveyJS custom "Prefill demo data" button. */}
            <Button variant="outline-primary" type="button" onClick={prefillForm}>
              Prefill demo data
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
