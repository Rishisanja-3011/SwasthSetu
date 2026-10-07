# VAANIDOC 2.0 — COMPLETE MASTER PROMPT & PROJECT SPECIFICATION
**Version:** Final working specification  
**Based on:** plan.md + VaaniDoc 2.0 Source of Truth + latest project clarification  
**Source Priority:** (1) latest explicit team/user decisions, (2) this Master Prompt, (3) the VaaniDoc 2.0 Source of Truth and plan.md.

---

## IMPORTANT CURRENT ARCHITECTURE CORRECTION
The existing VaaniDoc patient→doctor workflow is already working and must be preserved. VaaniDoc is NOT the system where a lab technician uploads a blood-report PDF for extraction. The laboratory/report-generation side produces the blood report; the extraction/insight engine is added there. After lab review and publication, the final report/findings are connected back to VaaniDoc for the patient dashboard and future Revisiting doctor workflow.

---

## 1. Product Identity and Goals
VaaniDoc is a lightweight, patient-centered healthcare workflow connecting patients, doctors and laboratories while keeping access bounded by the task that requires it.

### One-Sentence Definition
A healthcare workflow where doctor access exists only while a consultation is open, laboratory access exists only until the relevant report is published, and the patient retains their own published record.

### Core Pillars
1. **UNDERSTAND:** Multilingual voice/text becomes structured patient intake, reviewed/corrected by the patient.
2. **VERIFY:** Lab-generated CBC data becomes structured, confidence-checked and deterministically validated; original report is preserved.
3. **BOUNDED ACCESS:** Doctor and lab access expires automatically when the workflow task ends; no manual revoke.

### Key Characteristics
- Lightweight web app / PWA; no mandatory app-store installation.
- QR-first discovery with human-readable fallback code.
- Local-language voice/text support where available.
- Low-bandwidth/intermittent-network awareness.
- Simple interfaces for low digital literacy.

---

## 2. Current System vs Expansion

### Already Working — Protect This
**PATIENT:**
- Scan Doctor QR → Confirm Doctor → New/Revisiting
- Voice/Text Symptoms → Structured Intake → Patient Review
- Doctor Queue → Doctor Reviews Symptoms
- START CONSULTATION → Patient sees started → Consultation
- END CONSULTATION → Patient sees ended

### Expansion
- Doctor can create a diagnostic order such as CBC.
- Patient can scan a registered lab QR and approve sharing of Name, Age/DOB, Gender, and Phone.
- Lab's existing report-generation process produces the report.
- Extraction/insight processing is added at that report-generation side.
- Lab reviews extracted CBC values and publishes.
- Published report/findings connect back to VaaniDoc.
- Patient sees the report in the dashboard and can access the original report.
- Future Revisiting consultation can show allowed historical data.
- Patient dashboard includes a blood-report/basic-health chatbot.

---

## 3. Complete End-to-End Rahul Workflow

### A. First Doctor Visit
1. Rahul enters clinic
2. Scans Dr. Mehta QR
3. Confirms doctor
4. Selects NEW
5. Voice/text symptoms
6. Structured intake
7. Patient reviews/corrects
8. Joins queue
9. Doctor reviews symptoms
10. Doctor STARTS consultation
11. Patient sees started and goes to cabin
12. Consultation
13. Doctor notes / optional CBC order
14. Doctor ENDS consultation
15. Encounter CLOSED
16. Patient sees completed
17. Doctor access expires

### B. Laboratory
1. Rahul visits lab
2. Scans Lab QR
3. Approves identity-field popup
4. Lab receives Name + Age/DOB + Gender + Phone only
5. Lab performs CBC
6. Lab report-generation process generates report
7. Extraction engine processes generated report
8. CBC parse → normalize → validate
9. Uncertain/implausible values = NEEDS_REVIEW
10. Lab reviews/corrects
11. Lab publishes
12. Lab access expires automatically
13. Final report/findings connected to VaaniDoc
14. Patient dashboard shows report/findings + original report

### C. Return to Doctor
1. Rahul later scans Dr. Mehta QR
2. Confirms doctor
3. Selects REVISITING
4. Voice/text is optional
5. Joins queue
6. Doctor opens patient
7. Today's intake if supplied
8. Doctor's own previous notes
9. All published lab reports allowed by current model
10. Consultation
11. END CONSULTATION
12. Historical access becomes unqueryable

---

## 4. Patient–Doctor Workflow
- Every doctor has a QR plus fallback code such as DOC-409.
- Patient confirms doctor identity after scanning.
- Patient manually chooses NEW or REVISITING; never auto-detect this.
- NEW: voice/text intake mandatory; historical notes/reports are not unlocked.
- REVISITING: voice/text intake optional.
- After intake review, encounter is OPEN and patient joins queue.
- Doctor sees structured intake when opening the queue item.
- START CONSULTATION changes the patient-visible consultation state.
- END CONSULTATION closes the encounter.
- Raw voice audio is permanently deleted at closure.
- Transcript, structured intake and doctor's notes remain retained.
- Closed encounters cannot be queried by the doctor through the server.

| Choice | Patient Input | Doctor Access While OPEN |
|---|---|---|
| NEW | Voice/text mandatory | Today's intake only |
| REVISITING | Voice/text optional | Today's intake + own prior notes + published lab reports |

---

## 5. Patient–Laboratory Workflow
The lab workflow is connected to VaaniDoc, but report generation/extraction belongs at the laboratory/report-generation side.

- Scan Lab QR → permission popup → patient allows → LabAccessGrant ACTIVE
- Lab sees only Name, Age/DOB, Gender, Phone
- Lab performs test → lab generates report
- Extraction/insight engine processes report → lab reviews → publish
- LabAccessGrant EXPIRED
- Patient gets published result in VaaniDoc

**NO VAANIDOC PDF-UPLOAD EXTRACTION FLOW:**
Do not build VaaniDoc as a generic PDF-upload blood-report analyzer. The lab/report-generation environment generates the report and runs/hosts the extraction process; VaaniDoc receives the final published report/findings and exposes them to the patient and authorized Revisiting doctor.

---

## 6. Blood Report Generation + Extraction Integration
- Live report scope: **CBC only**.
- Live path: digital/text-layer report only.
- OCR is a future extension point, not a live/demo path.
- Extraction is integrated at the lab/report-generation stage.

### Pipeline:
```
LAB REPORT GENERATION
       ↓
Generated CBC Report
       ↓
Digital Text Extraction
       ↓
CBC Parser (regex/rules first)
       ↓
Normalization (Hb/Hgb/Haemoglobin → hemoglobin)
       ↓
Deterministic Validation (reference range + plausibility bounds)
       ↓
Confidence / Review
  ├─ HIGH CONFIDENCE → ready for lab sign-off
  └─ LOW/IMPLAUSIBLE → NEEDS_REVIEW
       ↓
LAB REVIEW
       ↓
PUBLISH
       ↓
Final report + observations connected to VaaniDoc
```

### Observation Rules:
| Test | Canonical | Reference Range (Example) | Status |
|---|---|---|---|
| Hemoglobin | hemoglobin | 13–17 g/dL | LOW / NORMAL / HIGH |
| WBC | wbc | 4,000–11,000 /µL | LOW / NORMAL / HIGH |
| Platelets | platelets | 150,000–450,000 /µL | LOW / NORMAL / HIGH |

- Missing reference range → null; never invent.
- Missing/ambiguous unit → preserve original and flag review; never silently convert.
- Implausible value → NEEDS_REVIEW regardless of extractor confidence.
- Low-confidence value → NEEDS_REVIEW.
- **Any NEEDS_REVIEW blocks publication.**
- Original report remains preserved and unmodified.
- Published observations are locked in this build.
- Duplicate ingestion should be detected/flagged, e.g. by file hash.

---

## 7. Bounded Access / Security Model
**CORE SECURITY IDEA:**
Access is not a standing permission waiting to be revoked. Access is structurally tied to the workflow and expires automatically.

### Rule A — Doctor Access
- Encounter fields: `visit_type = NEW/REVISITING`; `status = OPEN/CLOSED`.
- While OPEN, doctor can access the current encounter's own intake.
- REVISITING additionally exposes every prior ConsultationNote authored by this doctor for this patient.
- REVISITING additionally exposes every PUBLISHED DiagnosticReport for this patient, regardless of lab or ordering doctor.
- NEW exposes none of the historical notes/reports above.
- END CONSULTATION changes status to CLOSED and stops the unlocked history from being queryable.
- Authorization is server-side on every request; UI hiding is not security.

### Rule B — Lab Access
- LabAccessGrant created when patient approves the lab popup.
- Exactly four identity fields are exposed: name, age/DOB, gender, phone.
- Grant expires when associated report is published.
- Grant also expires after 48 hours if the report task is abandoned.
- No manual revoke.

**No Revoke Button:**
Doctor access dies when consultation ends. Lab access dies when report publication completes. This is a deliberate product principle.

---

## 8. Roles and Permissions
| Role | Purpose | Access |
|---|---|---|
| Patient | Owns identity; starts encounters/lab visits | Own full record and published reports |
| Doctor | Runs consultation | Only current encounter; Revisiting history while OPEN |
| Laboratory | Runs tests and publishes results | Only identity-check fields while grant is ACTIVE |

No Hospital Admin, Platform Admin or fourth/fifth product role. Lab onboarding is a one-time backend/manual step.

---

## 9. AI and Logic Components
- **Voice & Language:** Audio → Language + transcript (Hosted STT)
- **Intake Extraction:** Transcript → Chief complaint, duration, symptoms, confidence (Hosted LLM JSON)
- **Report Parsing:** Generated report text → Candidate CBC observations (Rules/regex first; LLM fallback only for ambiguity)
- **Deterministic Validation:** Observation + reference range → Confidence/review + HIGH/LOW/NORMAL (Pure logic)
- **Chatbot:** Source-grounded report/basic-health answers (Educational only, never diagnostic).

---

## 10. Data Model
- `users`: id, role, phone, auth_provider_id, created_at
- `patients`: id, user_id, name, date_of_birth, gender, phone, patient_identifier
- `doctors`: id, user_id, name, specialty, qr_code_id
- `laboratories`: id, name, qr_code_id, platform_approval_status
- `encounters`: id, patient_id, doctor_id, visit_type (NEW/REVISITING), status (OPEN/CLOSED), started_at, ended_at
- `symptom_intakes`: id, encounter_id, input_mode (voice/text/skipped), transcript, structured_data JSON, confidence, created_at
- `consultation_notes`: id, encounter_id, doctor_id, patient_id, notes_text, created_at
- `diagnostic_orders`: id, encounter_id, patient_id, doctor_id, test_type, status (ORDERED/COMPLETED), created_at
- `lab_access_grants`: id, patient_id, laboratory_id, diagnostic_order_id, granted_at, status (ACTIVE/EXPIRED), expires_at
- `diagnostic_reports`: id, patient_id, laboratory_id, diagnostic_order_id, status (UPLOADED/PROCESSING/NEEDS_REVIEW/PUBLISHED), created_at, published_at
- `report_files`: id, report_id, original_file_path or external_report_reference, uploaded_at
- `lab_observations`: id, report_id, test_name_original, test_name_normalized, value, unit, reference_low, reference_high, flag (HIGH/LOW/NORMAL), extraction_confidence, validation_status (OK/NEEDS_REVIEW)
- `audit_events`: id, actor_type, actor_id, action, resource_type, resource_id, patient_id, timestamp, outcome

---

## 11. Screens and UI Requirements
1. Login / OTP (All)
2. Home / Scan (Patient)
3. Confirm Doctor + New/Revisiting (Patient)
4. Voice/Text Intake (Patient)
5. Intake Review (Patient)
6. Queue / Waiting (Patient)
7. Reports List + Detail (Patient)
8. Health Timeline (Patient)
9. Lab Access Popup (Patient)
10. Doctor Queue (Doctor)
11. Clinical Cockpit (Doctor)
12. Lab Visit Verification (Lab)
13. Report/Integration Status (Lab)
14. Extraction Review (Lab)
15. Lab Dashboard (Lab)
16. Patient Health Chatbot (Patient)

---

## 12. Things Must NOT Do (Rules for AI Assistants)
- Do not rebuild the already-working doctor QR→symptoms→queue→start→end workflow.
- Do not make VaaniDoc responsible for generating the blood report.
- Do not turn VaaniDoc into a generic PDF-upload blood-report analyzer.
- Keep report extraction at the laboratory/report-generation side and connect published results back to VaaniDoc.
- Do not add Hospital Admin or Platform Admin.
- Do not add manual revoke buttons.
- Always enforce access server-side.
- Never expose another doctor's private consultation notes.
- Never publish unresolved NEEDS_REVIEW observations.
- Never invent a reference range.
- Never silently convert an ambiguous unit.
- Prefer deterministic rules over unnecessary generative AI.
