# Blood Report — Connected Healthcare Platform
## Database & Schema Design Specification — V1 (Phase 1)

> **Document Status:** Draft for Review & Approval  
> **Target Version:** V1.0  
> **Scope:** Phase 1 Architecture & Schema Design Only (No Code Modifications or DB Creation Executed)

---

## 1. Repository Inspection Summary

A comprehensive inspection of the existing codebase (`blood-report-analysis-ai`) was performed across 10 key technical dimensions:

1. **Current Project Structure:** Modular Python layout consisting of `extraction/` (ingestion, cleaner, parsers, validator, plausibility, coverage), `vision/` (scanned PDF classification, image preprocessing, PaddleOCR integration), `interpretation/` (reference range resolver, age boundary utils), `knowledge_engine/` (scaffolded models, services, CBC YAML rules), `medical_reference/` (Mayo reference data), `samples/`, and `tests/`.
2. **Backend Technology:** Python 3.10/3.13. Web interface built with Streamlit (`app.py`). Core libraries include PyMuPDF (`fitz`), OpenCV (`cv2`), NumPy, PaddleOCR (`paddleocr`, `paddlex`), PyYAML, and `pytest`.
3. **Existing Database:** **NONE.** No relational or document database exists in the current repository. Data is strictly processed in-memory as Python dictionaries and dataclasses.
4. **Existing Models / Classes:** Standard Python dataclasses exist in `knowledge_engine/models/` (`Patient`, `Report`, `LabResult`, `Finding`, `Pattern`, `Evidence`, `MatchResult`) and dataclasses in `extraction/pipeline.py` (`SourceMeta`, `PipelineResult`).
5. **Existing API Structure:** No REST, GraphQL, or gRPC framework is present. Code is triggered via CLI (`main.py`), Streamlit UI (`app.py`), or direct module function imports (`extraction.pipeline.process`).
6. **Existing File / PDF Handling:** Embedded PDF text extraction via PyMuPDF in `pdf_reader.py`. Image file decoding and temporary PDF buffer creation via OpenCV and `tempfile` in `ui_uploads.py`.
7. **Existing OCR / Image-Processing Pipeline:** `vision/pdf_classifier.py` distinguishes digital PDFs from scanned documents. Scanned pages are rendered at 300 DPI, preprocessed via OpenCV (`preprocessor.py`), and processed through `PaddleOCREngine`.
8. **Existing Parser & Clinical Engine:** `extraction/parser.py` parses standard CBC markers via regex/proximity logic. `validator.py` checks structural validity and unit consistency. `plausibility.py` checks physiological bounds. `reference_resolver.py` resolves age/sex-banded reference ranges. `knowledge_engine/` matches structured findings to YAML pattern rules.
9. **Existing Tests:** Pure Python unit tests in `tests/` executable via `pytest` (`test_patient_parser.py`, `test_validator.py`, `test_reference_resolver.py`, `test_coverage.py`, `test_plausibility.py`, `test_age_boundary.py`).
10. **Existing Configuration / Environment Files:** `requirements.txt` defines core dependencies. No `.env` or configuration management module is currently present.

---

## 2. Current Database Situation

- **Current State:** The system operates statelessly. Once a report is uploaded and analyzed in Streamlit or CLI, the extracted results reside solely in RAM (`st.session_state` or local process memory) and are lost when the session ends.
- **Limitation:** The platform cannot track patient identity over time, store reports from multiple laboratories, enforce laboratory data ownership, handle report corrections/versioning, or manage doctor authorization.

---

## 3. Recommended Database Approach

Based on the Python-centric stack and strict relational requirements (central Patient identity, strict foreign key constraints, multi-tenant isolation, versioning history, and transaction integrity):

- **Database Engine (Production):** **PostgreSQL 15+** (supports row-level security, UUIDs, JSONB for metadata/raw findings, and robust ACID compliance).
- **Database Engine (Development / Testing):** **SQLite 3** (embedded file database for easy local developer setup and fast `pytest` execution).
- **ORM / Schema Tool:** **SQLAlchemy 2.0 (AsyncIO)** + **Alembic** for schema migrations. SQLAlchemy models will map directly to the domain dataclasses in `knowledge_engine/models/`.

---

## 4. Entity List

The database schema consists of **10 core entities**:

1. **`users`**: Base authentication and role entity for all system users (Patients, Lab Operators, Doctors).
2. **`patients`**: Central platform patient identity (`PX123456`), independent of lab internal IDs.
3. **`laboratories`**: Registered medical laboratory entities (`LAB001`).
4. **`doctors`**: Registered medical doctor entities (`DOC001`).
5. **`doctor_patient_access`**: Explicit authorization grants between Patients and Doctors.
6. **`reports`**: Parent container for a medical report linking Patient and Laboratory.
7. **`report_versions`**: Version history (`Version 1`, `Version 2`) tracking corrections and publication status.
8. **`report_documents`**: Original unchanged laboratory PDF files stored in blob/object storage.
9. **`lab_observations`**: Extracted structured lab test results (Hemoglobin, Platelets, etc.).
10. **`findings` & `processing_metadata`**: Clinical findings, pattern matches, and OCR/extraction pipeline execution metadata.

---

## 5. Entity Relationship Conceptual Diagram

```mermaid
erDiagram
    USERS ||--o| PATIENTS : "is a (role=PATIENT)"
    USERS ||--o| LABORATORIES : "is a (role=LAB)"
    USERS ||--o| DOCTORS : "is a (role=DOCTOR)"

    PATIENTS ||--o{ REPORTS : "owns central record"
    LABORATORIES ||--o{ REPORTS : "publishes report"
    PATIENTS ||--o{ DOCTOR_PATIENT_ACCESS : "grants access"
    DOCTORS ||--o{ DOCTOR_PATIENT_ACCESS : "receives access"

    REPORTS ||--o{ REPORT_VERSIONS : "has history"
    REPORTS ||--o{ REPORT_DOCUMENTS : "stores PDF"
    REPORT_VERSIONS ||--o{ LAB_OBSERVATIONS : "contains results"
    REPORT_VERSIONS ||--o{ FINDINGS : "contains patterns"
    REPORT_VERSIONS ||--o1 PROCESSING_METADATA : "tracks extraction"
```

---

## 6. Detailed Schema & Table Definitions

### 6.1 `users` Table
Holds login credentials, roles, and global account status.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PATIENT', 'LABORATORY', 'DOCTOR', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 `patients` Table (Central Patient Identity)
Stores the central platform patient identity (`PX123456`). Independent of laboratory internal IDs.

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    patient_code VARCHAR(20) UNIQUE NOT NULL, -- Format: PX123456
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patients_phone ON patients(phone_number);
```

### 6.3 `laboratories` Table
Holds lab business details and ownership identity.

```sql
CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    lab_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. LAB-METRO-01
    lab_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_labs_code ON laboratories(lab_code);
```

### 6.4 `doctors` Table
Holds doctor professional details.

```sql
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    doctor_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. DOC-88412
    full_name VARCHAR(255) NOT NULL,
    medical_license VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6.5 `doctor_patient_access` Table
Tracks explicit Patient ➔ Doctor access authorizations.

```sql
CREATE TABLE doctor_patient_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NULL, -- NULL means perpetual until revoked
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (patient_id, doctor_id)
);
CREATE INDEX idx_dpa_patient ON doctor_patient_access(patient_id, status);
CREATE INDEX idx_dpa_doctor ON doctor_patient_access(doctor_id, status);
```

### 6.6 `reports` Table (Parent Report Container)
Links a report to a Patient and originating Laboratory.

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL, -- Platform report code e.g. REP-2026-00921
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    laboratory_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
    lab_internal_patient_id VARCHAR(50) NULL, -- Optional lab internal ID (e.g. A-45891)
    lab_report_number VARCHAR(100) NULL, -- Lab's printed report number
    current_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (current_status IN ('PENDING', 'PUBLISHED', 'CORRECTED', 'WITHDRAWN')),
    latest_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_reports_lab ON reports(laboratory_id);
CREATE INDEX idx_reports_status ON reports(current_status);
```

### 6.7 `report_documents` Table (Original PDF Storage)
Preserves original unchanged laboratory PDF files.

```sql
CREATE TABLE report_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL_FILE', -- e.g. S3, LOCAL_FILE
    storage_path_or_url TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL, -- Integrity checksum
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documents_report ON report_documents(report_id);
```

### 6.8 `report_versions` Table (Version History)
Tracks report correction iterations (`Version 1`, `Version 2`).

```sql
CREATE TABLE report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN')),
    correction_reason TEXT NULL, -- Filled when version_number > 1
    corrected_by_user_id UUID NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (report_id, version_number)
);
CREATE INDEX idx_versions_report ON report_versions(report_id, version_number);
```

### 6.9 `lab_observations` Table (Structured Results)
Holds extracted CBC test markers for a specific report version.

```sql
CREATE TABLE lab_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
    canonical_name VARCHAR(100) NOT NULL, -- e.g. hemoglobin, platelets
    raw_name VARCHAR(255) NOT NULL, -- Name as printed on report
    numeric_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL, -- e.g. g/dL, 10^3/uL
    reference_range_raw VARCHAR(255) NULL, -- Printed reference text
    reference_min DOUBLE PRECISION NULL,
    reference_max DOUBLE PRECISION NULL,
    interpretation_flag VARCHAR(20) NULL CHECK (interpretation_flag IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_observations_version ON lab_observations(version_id);
CREATE INDEX idx_observations_marker ON lab_observations(canonical_name);
```

### 6.10 `findings` & `processing_metadata` Tables

```sql
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
    pattern_id VARCHAR(100) NOT NULL, -- e.g. microcytic_anemia_pattern
    pattern_name VARCHAR(255) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    clinical_explanation TEXT NOT NULL,
    is_doctor_diagnosis BOOLEAN NOT NULL DEFAULT FALSE, -- Must always be FALSE (V1 Rule 13)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE processing_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID UNIQUE NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
    input_type VARCHAR(50) NOT NULL, -- text_pdf, scanned_pdf, image
    page_count INT NULL,
    ocr_pages INT NOT NULL DEFAULT 0,
    ocr_confidence DOUBLE PRECISION NULL,
    extraction_duration_ms INT NOT NULL,
    coverage_percent DOUBLE PRECISION NOT NULL,
    validation_status VARCHAR(50) NOT NULL, -- PASSED, REQUIRES_CORRECTION, REJECTED
    raw_extraction_json JSONB NULL, -- Complete raw extraction output for audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Field-by-Field & Key Design Rules

### 7.1 Patient Universal Identity (Rule 1 & Rule 3)
- `patients.patient_code` (e.g. `PX123456`) is auto-generated by the system at patient registration.
- **Rule:** Lab internal patient IDs (e.g. `A-45891`, `B-77421`) are stored optionally in `reports.lab_internal_patient_id` as metadata, but NEVER used as foreign keys or identity resolution keys.

### 7.2 Laboratory Data Isolation (Rule 2, 4, 5)
- **Isolation Policy:**
  1. **Upload / Search:** Laboratory `LAB001` searches for `PX123456`. API returns ONLY `patients.id`, `patient_code`, `full_name`, `date_of_birth`, and `gender`.
  2. **Data Boundary:** `LAB001` queries to `reports` must strictly enforce `WHERE laboratory_id = :lab001_id`. `LAB001` cannot read reports created by `LAB002`.
  3. **Ownership Verification:** Updates/Corrections to a report execute `WHERE id = :report_id AND laboratory_id = :current_user_lab_id`. Attempts by another lab return `403 Forbidden`.

### 7.3 Doctor Authorization & Consent (Rule 7 & Rule 8)
- **Access Policy:**
  1. A Doctor cannot query patient reports by knowing `PX123456` alone.
  2. Doctor report access checks `doctor_patient_access` table:
     ```sql
     SELECT r.* FROM reports r
     JOIN doctor_patient_access dpa ON r.patient_id = dpa.patient_id
     WHERE dpa.doctor_id = :current_doctor_id
       AND dpa.patient_id = :target_patient_id
       AND dpa.status = 'ACTIVE'
       AND (dpa.expires_at IS NULL OR dpa.expires_at > CURRENT_TIMESTAMP)
       AND r.current_status = 'PUBLISHED';
     ```

### 7.4 Report Lifecycle Status Design (Sections 14 & 15)
- **Status State Machine:**
  - `PENDING`: PDF uploaded and processed by Layer 4 engine, awaiting lab operator publication. Invisible to Patient and Doctor.
  - `PUBLISHED`: Verified by lab operator and officially released. Visible on Patient Dashboard and Authorized Doctor Dashboard.
  - `CORRECTED`: A mistake was identified and corrected. Superseded by a higher `report_versions` record.
  - `WITHDRAWN`: Report revoked from active viewing by laboratory. History retained for legal compliance.

### 7.5 Report Versioning & Correction Design (Section 21 & Rule 6)
- **Immutable Rule:** `report_documents` and `report_versions` version 1 are **NEVER deleted or updated**.
- When Lab A issues a correction:
  1. `reports.latest_version` increments from `1` to `2`.
  2. `reports.current_status` updates to `'CORRECTED'`.
  3. A new `report_versions` row is created (`version_number = 2`, `status = 'PUBLISHED'`, `correction_reason = '...'`, `corrected_by_user_id = ...`).
  4. Previous version 1 status changes to `'SUPERSEDED'`.
  5. New `lab_observations` and `findings` rows are attached to Version 2.

### 7.6 Original PDF Storage Design (Section 17 & Rule 9)
- Original PDFs are uploaded to `report_documents` with an immutable SHA-256 hash (`sha256_hash`).
- Stored on secure file storage (`storage_path_or_url`).
- Extracted JSON structured data and findings are stored in relational tables (`lab_observations`, `findings`) linked via `version_id`.

---

## 8. Integration Point with Existing Layer 4 Engine

The existing Layer 4 engine (`extraction.pipeline.process`) returns a `PipelineResult` dataclass:

```python
PipelineResult(
    source=SourceMeta(...),
    raw_text=str,
    cleaned_text=str,
    patient=dict,
    tests=list[dict],
    coverage=dict,
    validation=dict,
    plausibility=dict
)
```

### Mapping PipelineResult to Database Tables:

```
PipelineResult
   ├── source & validation  ──► processing_metadata table
   ├── patient (age/sex)   ──► verification against patients table
   ├── tests               ──► lab_observations table (canonical_name, value, unit, reference)
   └── findings (engine)   ──► findings table (pattern_id, confidence, clinical_explanation)
```

---

## 9. Recommended Implementation Order (Phase 2+)

1. **Phase 2.1 — Database Setup & ORM Models:** Implement SQLAlchemy / Alembic scripts for the 10 tables.
2. **Phase 2.2 — Central Patient Identity & Lab Upload Backend:** APIs for Patient Registration (`PX123456`), Lab Auth, and PDF upload pipeline invocation.
3. **Phase 2.3 — Report Publishing & Versioning Service:** Lifecycle status machine (`PENDING` ➔ `PUBLISHED` ➔ `CORRECTED`).
4. **Phase 2.4 — Doctor Authorization & Access Service:** Consent grant/revoke logic and Doctor Dashboard backend APIs.
5. **Phase 2.5 — Layer 1 UI Dashboards:** Streamlit / Web UI views for Patient, Laboratory, and Doctor.

---

## 10. Decisions Requiring User Approval

> [!IMPORTANT]
> **Items for User Review & Sign-Off:**
> 1. **Database Technology Choice:** Proposing **PostgreSQL** for production deployment and **SQLite** for zero-dependency local testing/development. Is this acceptable?
> 2. **ORM Choice:** Proposing **SQLAlchemy 2.0 (AsyncIO)** in Python to integrate with existing Python codebase seamlessly.
> 3. **Patient ID Format:** Proposing `PX` prefix followed by 6 alphanumeric digits (e.g. `PX123456`).
