"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
// Comparison column shows the active style's REAL shadcn button (per-style,
// CLI-generated). Aliased to Button so every form button below picks it up.
import { StyledButton as Button } from "@/components/ui/styled-button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashIcon } from "lucide-react";
import { medicalFormJson, medicalFormSample } from "@adapter/schemas";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperLabel,
  StepperList,
  StepperSeparator,
} from "@/components/ui/stepper";
import { useBorderlessMode } from "./BorderlessMode";
import { FormCompleted } from "./FormCompleted";
import { RequiredLabel, RequiredMark } from "./RequiredLabel";

/**
 * Hand-built shadcn/ui twin of the SurveyJS medical-intake form
 * (`medicalFormJson` in @adapter/schemas), grouped into the SAME four sections —
 * Patient, Insurance, History, Consent — and PAGED into them as a wizard to
 * match the SurveyJS form's `showProgressBar` / `progressBarType: "pages"`.
 *
 * Mirrors the SAME chrome (the survey title + description) and the SAME
 * behaviours: controlled inputs, per-page required-field validation that blocks
 * Next, a conditional secondary-insurance section, dynamic add/remove allergy
 * rows, and a final Complete that validates the whole
 * form and shows a success state.
 *
 * This column is deliberately UNBRIDGED: it is the "what you'd hand-write per
 * form" baseline the comparison footer measures against (see FormMetricsFooter).
 * SurveyJS pages from the JSON for free; here every step is wired by hand — that
 * gap is the point. Pure host chrome — shadcn/ui primitives, zero SurveyJS
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

const CONTACT_METHODS = ["Phone", "Email", "Text message"] as const;
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;

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

/**
 * Native twin of the "Cardless questions" switch (top menu), which maps onto
 * survey-core's `isCompact` in the SurveyJS column: with it off, a question
 * standing directly on the page gets its own box. Questions inside a panel
 * (here: the insurance / history Cards) keep no box either way, so only the
 * fields NOT already in a Card are wrapped.
 */
function QuestionBox({ children }: { children: ReactNode }) {
  const { borderless } = useBorderlessMode();
  if (borderless) return <>{children}</>;
  return (
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  );
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
  const [signature, setSignature] = useState("");
  const [signedDate, setSignedDate] = useState("");

  const [submitted, setSubmitted] = useState(false);

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
        setSignature(s.signature as string);
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
    <div className="native-controls border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold leading-none">
            Patient Intake (Native shadcn)
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {medicalFormJson.description as string}
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <Stepper value={String(currentPage)}>
            <StepperList aria-label="Form steps" className="gap-3">
              {PAGES.map((title, index) => (
                <StepperItem
                  key={title}
                  value={String(index)}
                  completed={index < currentPage}
                  defaultTrigger={false}
                  separator={false}
                >
                  <div className="inline-flex min-h-10 w-full min-w-0 flex-col items-center gap-2 text-center text-sm font-medium text-muted-foreground">
                    <StepperIndicator />
                    <StepperLabel>{title}</StepperLabel>
                  </div>
                  <StepperSeparator />
                </StepperItem>
              ))}
            </StepperList>
          </Stepper>

          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {PAGES[currentPage]}
          </h3>

        <form noValidate onSubmit={handleSubmit}>
          {/* ── Patient ───────────────────────────────────────────── */}
          {currentPage === 0 && (
            <FieldGroup>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <QuestionBox>
                  <Field data-invalid={showErrors && errors.firstName}>
                    <RequiredLabel htmlFor="nf-first">First name</RequiredLabel>
                    <Input
                      id="nf-first"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      aria-invalid={showErrors && errors.firstName}
                    />
                    {showErrors && errors.firstName && (
                      <FieldError>First name is required.</FieldError>
                    )}
                  </Field>
                </QuestionBox>
                <QuestionBox>
                  <Field data-invalid={showErrors && errors.lastName}>
                    <RequiredLabel htmlFor="nf-last">Last name</RequiredLabel>
                    <Input
                      id="nf-last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      aria-invalid={showErrors && errors.lastName}
                    />
                    {showErrors && errors.lastName && (
                      <FieldError>Last name is required.</FieldError>
                    )}
                  </Field>
                </QuestionBox>
              </FieldGroup>

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <QuestionBox>
                  <Field data-invalid={showErrors && errors.dob}>
                    <RequiredLabel htmlFor="nf-dob">Date of birth</RequiredLabel>
                    <Input
                      id="nf-dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      aria-invalid={showErrors && errors.dob}
                    />
                    {showErrors && errors.dob && (
                      <FieldError>Date of birth is required.</FieldError>
                    )}
                  </Field>
                </QuestionBox>
                <QuestionBox>
                  <Field>
                    <FieldLabel>Sex assigned at birth</FieldLabel>
                    <RadioGroup
                      value={sex}
                      onValueChange={(value: string) => setSex(value as Sex)}
                    >
                      <Field orientation="horizontal">
                        <RadioGroupItem value="f" id="nf-sex-f" />
                        <Label htmlFor="nf-sex-f">Female</Label>
                      </Field>
                      <Field orientation="horizontal">
                        <RadioGroupItem value="m" id="nf-sex-m" />
                        <Label htmlFor="nf-sex-m">Male</Label>
                      </Field>
                    </RadioGroup>
                  </Field>
                </QuestionBox>
              </FieldGroup>

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <QuestionBox>
                  <Field>
                    <FieldLabel htmlFor="nf-phone">Mobile phone</FieldLabel>
                    <Input
                      id="nf-phone"
                      type="tel"
                      placeholder="+1 (___) ___-____"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                    />
                    <FieldDescription>
                      We&apos;ll send appointment reminders to this number.
                    </FieldDescription>
                  </Field>
                </QuestionBox>
                <QuestionBox>
                  <Field>
                    <FieldLabel htmlFor="nf-contact">Preferred contact method</FieldLabel>
                    <Combobox
                      items={CONTACT_METHODS}
                      value={preferredContact || null}
                      onValueChange={(value: string | null) => setPreferredContact(value ?? "")}
                    >
                      <ComboboxInput
                        id="nf-contact"
                        placeholder="Select an option…"
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: string) => (
                            <ComboboxItem key={item} value={item}>
                              {item}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </Field>
                </QuestionBox>
              </FieldGroup>
            </FieldGroup>
          )}

          {/* ── Insurance ─────────────────────────────────────────── */}
          {currentPage === 1 && (
            <FieldGroup>
              <Card>
                <CardHeader>
                  <CardTitle>Primary insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={showErrors && errors.carrier}>
                        <RequiredLabel htmlFor="nf-carrier">Insurance carrier</RequiredLabel>
                        <Input
                          id="nf-carrier"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          aria-invalid={showErrors && errors.carrier}
                        />
                        {showErrors && errors.carrier && (
                          <FieldError>Insurance carrier is required.</FieldError>
                        )}
                      </Field>
                      <Field data-invalid={showErrors && errors.memberId}>
                        <RequiredLabel htmlFor="nf-member">Member ID</RequiredLabel>
                        <Input
                          id="nf-member"
                          value={memberId}
                          onChange={(e) => setMemberId(e.target.value)}
                          aria-invalid={showErrors && errors.memberId}
                        />
                        {showErrors && errors.memberId && (
                          <FieldError>Member ID is required.</FieldError>
                        )}
                      </Field>
                    </FieldGroup>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="nf-group">Group number</FieldLabel>
                        <Input
                          id="nf-group"
                          value={groupNumber}
                          onChange={(e) => setGroupNumber(e.target.value)}
                        />
                      </Field>
                    </FieldGroup>
                    <Field>
                      <FieldLabel>Patient is the…</FieldLabel>
                      <RadioGroup
                        value={relationship}
                        onValueChange={(value: string) => setRelationship(value as Relationship)}
                      >
                        {(
                          [
                            { value: "self", text: "Policyholder" },
                            { value: "spouse", text: "Spouse" },
                            { value: "dependent", text: "Dependent" },
                          ] as const
                        ).map((opt) => (
                          <Field key={opt.value} orientation="horizontal">
                            <RadioGroupItem value={opt.value} id={`nf-rel-${opt.value}`} />
                            <Label htmlFor={`nf-rel-${opt.value}`}>
                              {opt.text}
                            </Label>
                          </Field>
                        ))}
                      </RadioGroup>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <QuestionBox>
                <Field orientation="horizontal">
                  <Switch
                    id="nf-secondary"
                    checked={hasSecondary}
                    onCheckedChange={setHasSecondary}
                  />
                  <FieldLabel htmlFor="nf-secondary">
                    Do you have secondary insurance?
                  </FieldLabel>
                </Field>
              </QuestionBox>

              {hasSecondary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Secondary insurance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={showErrors && errors.carrier2}>
                        <RequiredLabel htmlFor="nf-carrier2">Insurance carrier</RequiredLabel>
                        <Input
                          id="nf-carrier2"
                          value={carrier2}
                          onChange={(e) => setCarrier2(e.target.value)}
                          aria-invalid={showErrors && errors.carrier2}
                        />
                        {showErrors && errors.carrier2 && (
                          <FieldError>Insurance carrier is required.</FieldError>
                        )}
                      </Field>
                      <Field data-invalid={showErrors && errors.memberId2}>
                        <RequiredLabel htmlFor="nf-member2">Member ID</RequiredLabel>
                        <Input
                          id="nf-member2"
                          value={memberId2}
                          onChange={(e) => setMemberId2(e.target.value)}
                          aria-invalid={showErrors && errors.memberId2}
                        />
                        {showErrors && errors.memberId2 && (
                          <FieldError>Member ID is required.</FieldError>
                        )}
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}
            </FieldGroup>
          )}

          {/* ── History ───────────────────────────────────────────── */}
          {currentPage === 2 && (
            <FieldGroup>
              <Card>
                <CardHeader>
                  <FieldLabel>
                    Have you ever been diagnosed with any of the following?
                  </FieldLabel>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead />
                        <TableHead className="text-center">Yes</TableHead>
                        <TableHead className="text-center">No</TableHead>
                        <TableHead className="text-center">Unsure</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {HISTORY_ROWS.map((row) => (
                        <TableRow key={row.value}>
                          <TableHead>{row.text}</TableHead>
                          <RadioGroup
                            value={history[row.value]}
                            onValueChange={(value: string) =>
                              setHistory((h) => ({
                                ...h,
                                [row.value]: value as HistoryAnswer,
                              }))
                            }
                            className="contents"
                          >
                            {(["yes", "no", "unsure"] as const).map((answer) => (
                              <TableCell key={answer} align="center">
                                <RadioGroupItem
                                  value={answer}
                                  aria-label={`${row.text}: ${answer}`}
                                />
                              </TableCell>
                            ))}
                          </RadioGroup>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
              <CardHeader>
                  <FieldLabel>
                    Allergies
                  </FieldLabel>
                </CardHeader>
              <CardContent>
              <Field>
                {allergies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No allergies added.</p>
                )}
                {allergies.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">
                          Allergen <RequiredMark />
                        </TableHead>
                        <TableHead className="text-center">Severity</TableHead>
                        <TableHead className="text-center">Reaction</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allergies.map((allergy, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              id={`nf-allergen-${index}`}
                              placeholder="Allergen"
                              aria-label="Allergen"
                              value={allergy.allergen}
                              onChange={(e) => updateAllergy(index, "allergen", e.target.value)}
                              aria-invalid={showErrors && errors.allergens[index]}
                            />
                            {showErrors && errors.allergens[index] && (
                              <FieldError>Allergen is required.</FieldError>
                            )}
                          </TableCell>
                          <TableCell>
                            <Combobox
                              items={SEVERITY_OPTIONS}
                              value={allergy.severity || null}
                              onValueChange={(value: string | null) =>
                                updateAllergy(index, "severity", value ?? "")
                              }
                            >
                              <ComboboxInput
                                id={`nf-severity-${index}`}
                                className="w-full"
                                placeholder="Severity…"
                                aria-label="Severity"
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item: string) => (
                                    <ComboboxItem key={item} value={item}>
                                      {item}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </TableCell>
                          <TableCell>
                            <Input
                              id={`nf-reaction-${index}`}
                              placeholder="Reaction"
                              aria-label="Reaction"
                              value={allergy.reaction}
                              onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="light"
                              size="icon-sm"
                              aria-label={`Remove allergy ${index + 1}`}
                              onClick={() => removeAllergy(index)}
                            >
                              <TrashIcon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <Field orientation="horizontal">
                  <Button type="button" variant="secondary" size="sm" onClick={addAllergy}>
                    Add allergy
                  </Button>
                </Field>
              </Field>
              </CardContent>
              </Card>

              <QuestionBox>
                <Field>
                  <FieldLabel htmlFor="nf-meds">Current medications</FieldLabel>
                  <Textarea
                    id="nf-meds"
                    rows={3}
                    value={currentMedications}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentMedications(e.target.value)}
                  />
                </Field>
              </QuestionBox>
            </FieldGroup>
          )}

          {/* ── Consent ───────────────────────────────────────────── */}
          {currentPage === 3 && (
            <FieldGroup>
              <QuestionBox>
                <Field
                  orientation="horizontal"
                  data-invalid={showErrors && errors.consentTreatment}
                >
                  <Checkbox
                    id="nf-consent-treatment"
                    checked={consentTreatment}
                    onCheckedChange={(checked: boolean | "indeterminate") => setConsentTreatment(checked === true)}
                  />
                  <FieldContent>
                    <RequiredLabel htmlFor="nf-consent-treatment">
                      I consent to treatment
                    </RequiredLabel>
                    {showErrors && errors.consentTreatment && (
                      <FieldError>Consent to treatment is required.</FieldError>
                    )}
                  </FieldContent>
                </Field>
              </QuestionBox>

              <QuestionBox>
                <Field
                  orientation="horizontal"
                  data-invalid={showErrors && errors.consentPrivacy}
                >
                  <Checkbox
                    id="nf-consent-privacy"
                    checked={consentPrivacy}
                    onCheckedChange={(checked: boolean | "indeterminate") => setConsentPrivacy(checked === true)}
                  />
                  <FieldContent>
                    <RequiredLabel htmlFor="nf-consent-privacy">
                      I acknowledge the privacy practices (HIPAA)
                    </RequiredLabel>
                    {showErrors && errors.consentPrivacy && (
                      <FieldError>Acknowledgement is required.</FieldError>
                    )}
                  </FieldContent>
                </Field>
              </QuestionBox>

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <QuestionBox>
                <Field>
                  <FieldLabel htmlFor="nf-signature">Signature</FieldLabel>
                  <Input
                    id="nf-signature"
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </Field>
              </QuestionBox>

              <QuestionBox>
                <Field>
                  <FieldLabel htmlFor="nf-signed">Date</FieldLabel>
                  <Input
                    id="nf-signed"
                    type="date"
                    value={signedDate}
                    onChange={(e) => setSignedDate(e.target.value)}
                  />
                </Field>
              </QuestionBox>
              </FieldGroup>
            </FieldGroup>
          )}

          {/* ── Wizard navigation ─────────────────────────────────── */}
          <Field className="mt-6" orientation="horizontal">
            {currentPage > 0 && (
              <Button type="button" variant="outline" onClick={goBack}>
                Previous
              </Button>
            )}
            {currentPage < LAST_PAGE ? (
              <Button type="button" variant="outline" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit">Complete</Button>
            )}
            {/* Native twin of the SurveyJS custom "Prefill demo data" button. */}
            <Button type="button" variant="outline" onClick={prefillForm}>
              Prefill demo data
            </Button>
          </Field>
        </form>
        </div>
    </div>
  );
}
