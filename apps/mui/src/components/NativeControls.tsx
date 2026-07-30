"use client";

import {
  useState,
  type FormEvent,
} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import DeleteIcon from "@mui/icons-material/Delete";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { medicalFormJson, medicalFormSample } from "@adapter/schemas";
import { FormCompleted } from "./FormCompleted";
import { RequiredMark } from "./RequiredLabel";

/**
 * Hand-built Material UI twin of the SurveyJS medical-intake form
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
 * gap is the point. Pure host chrome — Material UI only, zero SurveyJS
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
    <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
        {/* Survey title + description — mirrors the SurveyJS column's header,
            sharing the schema's exact description so only the "(…)" suffix
            differs between the two forms. */}
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Patient Intake (Native MUI)
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {medicalFormJson.description as string}
        </Typography>

        {/* ── Wizard progress (mirrors SurveyJS progressBarType: "pages") ── */}
        <Stepper activeStep={currentPage} alternativeLabel sx={{ mb: 4 }}>
          {PAGES.map((title) => (
            <Step key={title}>
              <StepLabel>{title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Per-page title — the SurveyJS pages each carry a title, so the
            native wizard shows the active page's title too. */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          {PAGES[currentPage]}
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit}>
          {/* ── Patient ───────────────────────────────────────────── */}
          {currentPage === 0 && (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  id="nf-first-name"
                  label="First name"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={showErrors && errors.firstName}
                  helperText={showErrors && errors.firstName ? "First name is required." : " "}
                  required
                />
                <TextField
                  id="nf-last-name"
                  label="Last name"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={showErrors && errors.lastName}
                  helperText={showErrors && errors.lastName ? "Last name is required." : " "}
                  required
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                <TextField
                  id="nf-dob"
                  label="Date of birth"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={showErrors && errors.dob}
                  helperText={showErrors && errors.dob ? "Date of birth is required." : " "}
                  required
                />
                <FormControl fullWidth>
                  <FormLabel id="nf-sex-label">Sex assigned at birth</FormLabel>
                  <RadioGroup
                    row
                    name="nf-sex"
                    aria-labelledby="nf-sex-label"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as Sex)}
                  >
                    <FormControlLabel value="f" control={<Radio />} label="Female" />
                    <FormControlLabel value="m" control={<Radio />} label="Male" />
                  </RadioGroup>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  id="nf-phone"
                  label="Mobile phone"
                  type="tel"
                  fullWidth
                  placeholder="+1 (___) ___-____"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  helperText="We'll send appointment reminders to this number."
                />
                <FormControl fullWidth>
                  <InputLabel id="nf-contact-label">Preferred contact method</InputLabel>
                  <Select
                    labelId="nf-contact-label"
                    label="Preferred contact method"
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                  >
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Text message">Text message</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          )}

          {/* ── Insurance ─────────────────────────────────────────── */}
          {currentPage === 1 && (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Primary insurance
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Insurance carrier"
                        fullWidth
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        error={showErrors && errors.carrier}
                        helperText={showErrors && errors.carrier ? "Insurance carrier is required." : " "}
                        required
                      />
                      <TextField
                        label="Member ID"
                        fullWidth
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        error={showErrors && errors.memberId}
                        helperText={showErrors && errors.memberId ? "Member ID is required." : " "}
                        required
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Group number"
                        fullWidth
                        value={groupNumber}
                        onChange={(e) => setGroupNumber(e.target.value)}
                        sx={{ maxWidth: { sm: "calc(50% - 8px)" } }}
                      />
                    </Stack>
                    <FormControl>
                      <FormLabel id="nf-rel-label">Patient is the…</FormLabel>
                      <RadioGroup
                        aria-labelledby="nf-rel-label"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value as Relationship)}
                      >
                        <FormControlLabel value="self" control={<Radio />} label="Policyholder" />
                        <FormControlLabel value="spouse" control={<Radio />} label="Spouse" />
                        <FormControlLabel value="dependent" control={<Radio />} label="Dependent" />
                      </RadioGroup>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>

              <FormControlLabel
                control={
                  <Switch
                    checked={hasSecondary}
                    onChange={(e) => setHasSecondary(e.target.checked)}
                  />
                }
                label="Do you have secondary insurance?"
              />

              {hasSecondary && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Secondary insurance
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Insurance carrier"
                        fullWidth
                        value={carrier2}
                        onChange={(e) => setCarrier2(e.target.value)}
                        error={showErrors && errors.carrier2}
                        helperText={showErrors && errors.carrier2 ? "Insurance carrier is required." : " "}
                        required
                      />
                      <TextField
                        label="Member ID"
                        fullWidth
                        value={memberId2}
                        onChange={(e) => setMemberId2(e.target.value)}
                        error={showErrors && errors.memberId2}
                        helperText={showErrors && errors.memberId2 ? "Member ID is required." : " "}
                        required
                      />
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          )}

          {/* ── History ───────────────────────────────────────────── */}
          {currentPage === 2 && (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                <FormLabel sx={{ mb: 1 }}>
                  Have you ever been diagnosed with any of the following?
                </FormLabel>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell align="center">Yes</TableCell>
                      <TableCell align="center">No</TableCell>
                      <TableCell align="center">Unsure</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {HISTORY_ROWS.map((row) => (
                      <TableRow key={row.value}>
                        <TableCell component="th" scope="row">
                          {row.text}
                        </TableCell>
                        {(["yes", "no", "unsure"] as const).map((answer) => (
                          <TableCell key={answer} align="center" padding="none">
                            <Radio
                              name={`nf-history-${row.value}`}
                              inputProps={{ "aria-label": `${row.text}: ${answer}` }}
                              checked={history[row.value] === answer}
                              onChange={() =>
                                setHistory((h) => ({ ...h, [row.value]: answer }))
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              </Card>

              <Card variant="outlined">
              <CardContent>
                <FormLabel sx={{ display: "block", mb: 1 }}>Allergies</FormLabel>
                {allergies.length === 0 && (
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    No allergies added.
                  </Typography>
                )}
                {allergies.length > 0 && (
                  <Table sx={{ mb: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">
                          Allergen <RequiredMark />
                        </TableCell>
                        <TableCell sx={{ width: 140 }} align="center">Severity</TableCell>
                        <TableCell align="center">Reaction</TableCell>
                        <TableCell sx={{ width: 48 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allergies.map((allergy, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              placeholder="Allergen"
                              aria-label="Allergen"
                              value={allergy.allergen}
                              onChange={(e) => updateAllergy(index, "allergen", e.target.value)}
                              error={showErrors && errors.allergens[index]}
                              helperText={
                                showErrors && errors.allergens[index]
                                  ? "Allergen is required."
                                  : undefined
                              }
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              fullWidth
                              displayEmpty
                              value={allergy.severity}
                              onChange={(e) => updateAllergy(index, "severity", e.target.value)}
                              aria-label="Severity"
                              renderValue={(value) => value || "Severity…"}
                            >
                              <MenuItem value="" disabled>
                                Severity…
                              </MenuItem>
                              <MenuItem value="Mild">Mild</MenuItem>
                              <MenuItem value="Moderate">Moderate</MenuItem>
                              <MenuItem value="Severe">Severe</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              placeholder="Reaction"
                              aria-label="Reaction"
                              value={allergy.reaction}
                              onChange={(e) => updateAllergy(index, "reaction", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => removeAllergy(index)}
                              aria-label={`Remove allergy ${index + 1}`}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <Button size="small" onClick={addAllergy}>
                  Add allergy
                </Button>
              </CardContent>
              </Card>

              <TextField
                label="Current medications"
                fullWidth
                multiline
                minRows={3}
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
              />
            </Stack>
          )}

          {/* ── Consent ───────────────────────────────────────────── */}
          {currentPage === 3 && (
            <Stack spacing={2}>
              <FormControl error={showErrors && errors.consentTreatment}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={consentTreatment}
                      onChange={(e) => setConsentTreatment(e.target.checked)}
                    />
                  }
                  label="I consent to treatment"
                />
                {showErrors && errors.consentTreatment && (
                  <FormHelperText>Consent to treatment is required.</FormHelperText>
                )}
              </FormControl>

              <FormControl error={showErrors && errors.consentPrivacy}>
                <FormControlLabel
                  required
                  control={
                    <Checkbox
                      checked={consentPrivacy}
                      onChange={(e) => setConsentPrivacy(e.target.checked)}
                    />
                  }
                  label="I acknowledge the privacy practices (HIPAA)"
                />
                {showErrors && errors.consentPrivacy && (
                  <FormHelperText>Acknowledgement is required.</FormHelperText>
                )}
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Signature"
                  fullWidth
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <TextField
                  label="Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                  sx={{ maxWidth: { sm: "calc(50% - 8px)" } }}
                />
              </Stack>
            </Stack>
          )}

          {/* ── Wizard navigation ─────────────────────────────────── */}
          <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
            {currentPage > 0 && (
              <Button variant="outlined" type="button" onClick={goBack}>
                Previous
              </Button>
            )}
            {currentPage < LAST_PAGE ? (
              <Button variant="outlined" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" variant="contained">
                Complete
              </Button>
            )}
            {/* Native twin of the SurveyJS custom "Prefill demo data" button. */}
            <Button variant="outlined" type="button" onClick={prefillForm}>
              Prefill demo data
            </Button>
          </Stack>
        </Box>
    </Box>
  );
}
