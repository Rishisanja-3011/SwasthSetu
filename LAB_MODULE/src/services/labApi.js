// Laboratory API Service implementation complying with Person 3 specifications
// Implements boundaries, minimal patient searches, visit consent gating,
// clinical processing orchestration, report review, publishing, and versioned corrections.

import { getStoreItem, setStoreItem, STORAGE_KEYS, delay, logAuditEvent } from './api';

export const labApi = {
  // 1. Patient Search - Intentionally Minimal Identity Confirmation (Section 10.3 & 12.29)
  searchPatient: async (patientId, currentLab) => {
    await delay(350);

    // Rule 16 & 19.2: Lab account must be approved
    if (currentLab.admin_approval_status !== 'APPROVED') {
      return {
        success: false,
        error: `Laboratory account status is ${currentLab.admin_approval_status}. Only approved laboratories are authorized to query patient identities.`,
        code: 'LAB_NOT_APPROVED',
        forbidden: true
      };
    }

    if (!patientId || !patientId.trim()) {
      return {
        success: false,
        error: 'Please enter a valid Patient Platform ID (e.g., PX123456).',
        code: 'INVALID_INPUT'
      };
    }

    const query = patientId.trim().toUpperCase();
    const patients = getStoreItem(STORAGE_KEYS.PATIENTS) || [];
    const match = patients.find((p) => p.patient_id.toUpperCase() === query);

    if (!match) {
      return {
        success: false,
        error: `Patient ID "${query}" does not exist in the central platform registry.`,
        code: 'PATIENT_NOT_FOUND'
      };
    }

    // Audit log search action (Section 8.2 & 12.37)
    logAuditEvent('LABORATORY', currentLab.id, match.patient_id, 'searched', { query });

    // Intentionally minimal payload: Masked name, DOB, Gender, Patient ID ONLY
    // DO NOT expose phone, address, medical history, or other labs (Section 10.3)
    return {
      success: true,
      data: {
        patient_id: match.patient_id,
        name: match.maskedName,
        dob: match.dob,
        gender: match.gender,
        bloodGroup: match.bloodGroup // non-confidential physical attribute for specimen check
      }
    };
  },

  // 2. Check Visit Consent Status (Section 10.2 & 11)
  getVisitConsent: async (patientId, labId) => {
    await delay(200);
    const consents = getStoreItem(STORAGE_KEYS.VISIT_CONSENTS) || [];
    const consent = consents.find((c) => c.patient_id === patientId && c.lab_id === labId);

    if (!consent) {
      return {
        exists: false,
        status: null,
        message: 'No visit consent record found for this patient and laboratory.'
      };
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(consent.expires_at);
    if (now > expiresAt && consent.status === 'APPROVED') {
      consent.status = 'EXPIRED';
      setStoreItem(STORAGE_KEYS.VISIT_CONSENTS, consents);
    }

    return {
      exists: true,
      consent
    };
  },

  // 3. Verify Patient Visit Consent via OTP or Patient-Generated QR Check-in Token (Section 10.2)
  verifyVisitConsent: async (patientId, labId, method, tokenOrCode) => {
    await delay(400);

    if (!tokenOrCode || tokenOrCode.trim().length < 4) {
      return {
        success: false,
        error: 'Please enter a valid OTP code (e.g. 123456) or scan a valid check-in QR token.'
      };
    }

    // Simulating test edge cases:
    if (tokenOrCode === '000000' || tokenOrCode.toUpperCase() === 'DENIED') {
      return {
        success: false,
        error: 'Patient denied visit consent. Laboratory cannot attach reports.',
        code: 'CONSENT_DENIED'
      };
    }

    if (tokenOrCode === '999999' || tokenOrCode.toUpperCase() === 'EXPIRED') {
      return {
        success: false,
        error: 'Visit consent token has expired. Please ask the patient to generate a new check-in QR/OTP.',
        code: 'CONSENT_EXPIRED'
      };
    }

    // Successful consent verification (generates 48-hour upload window)
    const consents = getStoreItem(STORAGE_KEYS.VISIT_CONSENTS) || [];
    const visitId = 'VIS-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48-hour practical window

    const newConsent = {
      id: visitId,
      patient_id: patientId,
      lab_id: labId,
      method: method || 'otp',
      issued_at: now.toISOString(),
      expires_at: expires.toISOString(),
      status: 'APPROVED',
      linked_report_id: null
    };

    // Replace or add
    const filtered = consents.filter((c) => !(c.patient_id === patientId && c.lab_id === labId));
    filtered.push(newConsent);
    setStoreItem(STORAGE_KEYS.VISIT_CONSENTS, filtered);

    logAuditEvent('LABORATORY', labId, patientId, 'consent_verified', {
      visitId,
      method,
      expiresAt: expires.toISOString()
    });

    return {
      success: true,
      consent: newConsent,
      message: 'Visit consent verified successfully. 48-hour report upload window authorized.'
    };
  },

  // 4. Retrieve Laboratory's Own Reports (Section 2: Cannot see other labs' reports)
  getLabReports: async (labId, filterStatus = 'ALL') => {
    await delay(250);
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    let labReports = reports.filter((r) => r.lab_id === labId);

    if (filterStatus && filterStatus !== 'ALL') {
      labReports = labReports.filter((r) => r.status === filterStatus);
    }

    // Sort newest first
    return labReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // 5. Get Report Details by ID (Enforces Lab Ownership)
  getReportById: async (reportId, labId) => {
    await delay(200);
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    const report = reports.find((r) => r.report_id === reportId);

    if (!report) {
      return {
        success: false,
        error: `Report with ID "${reportId}" was not found.`,
        code: 'REPORT_NOT_FOUND'
      };
    }

    // Strict boundary: Only originating lab can view/edit
    if (report.lab_id !== labId) {
      return {
        success: false,
        error: 'Forbidden: Laboratories cannot access reports originating from other laboratory facilities.',
        code: 'FORBIDDEN_OTHER_LAB',
        forbidden: true
      };
    }

    logAuditEvent('LABORATORY', labId, report.patient_id, 'viewed', { report_id: reportId });

    return {
      success: true,
      report
    };
  },

  // 6. Upload Laboratory PDF Report (Gated by Visit Consent - Section 8.2, 10.2, 12.31)
  uploadReport: async ({ patientId, lab, testType, collectionDate, file }) => {
    await delay(400);

    // Rule: Check Lab status
    if (lab.admin_approval_status !== 'APPROVED') {
      return {
        success: false,
        error: `Upload blocked: Laboratory is currently ${lab.admin_approval_status}. Approved status is required.`,
        code: 'LAB_NOT_APPROVED'
      };
    }

    // Rule: Visit consent gate
    const consentRes = await labApi.getVisitConsent(patientId, lab.id);
    if (!consentRes.exists || consentRes.consent?.status !== 'APPROVED') {
      return {
        success: false,
        error: 'Upload blocked: Patient has not authorized this lab visit or the consent has expired. Please verify visit consent first.',
        code: 'VISIT_CONSENT_REQUIRED'
      };
    }

    const reportId = 'REP-2026-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const newReport = {
      report_id: reportId,
      patient_id: patientId,
      patient_masked_name: patientId === 'PX123456' ? 'Rahul S*****' : patientId === 'PX789012' ? 'Priya V****' : 'Ananya P****',
      lab_id: lab.id,
      lab_name: lab.name,
      visit_id: consentRes.consent.id,
      test_type: testType || 'Complete Blood Count (CBC) with Differential',
      collection_date: collectionDate || now,
      created_at: now,
      published_at: null,
      status: 'PENDING', // Initial stage per Section 5 & 10.4
      version: 1,
      pdf_filename: file?.name || `${testType.replace(/\s+/g, '_')}_${patientId}.pdf`,
      pdf_filesize: file ? `${(file.size / 1024).toFixed(1)} KB` : '460 KB',
      is_simulated_file: true,
      processing_metadata: {
        acquisition_type: 'DIGITAL_PDF',
        extraction_method: 'DIRECT_TEXT_EXTRACTION',
        ocr_confidence: 0.99,
        parsed_at: null,
        validated_at: null,
        processing_stage: 'UPLOAD_ACCEPTED' // 'UPLOAD_ACCEPTED' | 'EXTRACTING' | 'PARSING' | 'VALIDATING' | 'COMPLETED'
      },
      results: [],
      findings: [],
      patterns: [],
      version_history: [
        {
          version: 1,
          status: 'PENDING',
          timestamp: now,
          author: `${lab.name} Specimen Reception`,
          notes: 'Laboratory PDF report attached with patient visit consent.'
        }
      ]
    };

    // Save report in state
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    reports.unshift(newReport);
    setStoreItem(STORAGE_KEYS.REPORTS, reports);

    // Link consent to report
    const consents = getStoreItem(STORAGE_KEYS.VISIT_CONSENTS) || [];
    const updatedConsents = consents.map((c) =>
      c.id === consentRes.consent.id ? { ...c, linked_report_id: reportId } : c
    );
    setStoreItem(STORAGE_KEYS.VISIT_CONSENTS, updatedConsents);

    logAuditEvent('LABORATORY', lab.id, patientId, 'uploaded', {
      report_id: reportId,
      test_type: newReport.test_type
    });

    return {
      success: true,
      report: newReport,
      message: 'Report uploaded and accepted. Ready for clinical engine processing.'
    };
  },

  // 7. Clinical Processing Engine Simulation (Person 1 Contract - Section 4.1, 6, 7.1, 10.4)
  processReportThroughEngine: async (reportId, onProgress) => {
    const steps = [
      { step: 1, name: 'PDF Acquisition & Digital vs Scanned Classification', stage: 'CLASSIFYING', delay: 600 },
      { step: 2, name: 'Text Extraction & Optical Character Normalization', stage: 'EXTRACTING', delay: 700 },
      { step: 3, name: 'Syntactic Laboratory Parsing & Biomarker Extraction', stage: 'PARSING', delay: 700 },
      { step: 4, name: 'Extraction Validation & Reference Range Resolution', stage: 'VALIDATING', delay: 600 },
      { step: 5, name: 'Clinical Finding Generation & Multi-analyte Pattern Detection', stage: 'FINDINGS', delay: 600 }
    ];

    for (const s of steps) {
      if (onProgress) {
        onProgress(s);
      }
      await delay(s.delay);
    }

    // Produce structured results conforming to Person 1 contract (Section 7.4)
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);

    if (reportIndex === -1) {
      throw new Error(`Report ${reportId} not found during processing.`);
    }

    const current = reports[reportIndex];
    const isCBC = current.test_type.includes('CBC') || current.test_type.includes('Blood Count');

    let processedResults = [];
    let processedFindings = [];
    let processedPatterns = [];

    if (isCBC) {
      processedResults = [
        {
          test_name: 'Hemoglobin (Hb)',
          value: 10.8,
          unit: 'g/dL',
          reference_range: '13.5 - 17.5',
          status: 'LOW',
          clinical_note: 'Erythrocyte hemoglobin density beneath physiologic interval.'
        },
        {
          test_name: 'Mean Corpuscular Volume (MCV)',
          value: 74.2,
          unit: 'fL',
          reference_range: '80.0 - 100.0',
          status: 'LOW',
          clinical_note: 'Microcytosis detected.'
        },
        {
          test_name: 'Total Leukocyte Count (WBC)',
          value: 7200,
          unit: 'cells/mcL',
          reference_range: '4,000 - 11,000',
          status: 'NORMAL',
          clinical_note: 'White cell count within normal distribution.'
        },
        {
          test_name: 'Platelet Count',
          value: 230000,
          unit: '/mcL',
          reference_range: '150,000 - 450,000',
          status: 'NORMAL',
          clinical_note: 'Adequate thrombocyte count.'
        },
        {
          test_name: 'Serum Ferritin',
          value: 12.4,
          unit: 'ng/mL',
          reference_range: '24.0 - 336.0',
          status: 'LOW',
          clinical_note: 'Severely lowered iron storage stores.'
        }
      ];

      processedFindings = [
        {
          id: 'FIND-CBC-01',
          title: 'Microcytic Anemia Triad',
          severity: 'ATTENTION',
          detail: 'Concurrent depression in Hemoglobin (10.8 g/dL), MCV (74.2 fL), and Ferritin (12.4 ng/mL) is clinically characteristic of microcytic hypochromic iron deficiency anemia.'
        }
      ];

      processedPatterns = [
        {
          id: 'PAT-01',
          pattern_name: 'Iron Deficiency Erythropoiesis Pattern',
          confidence_level: 'HIGH',
          evidence_keys: ['Hb < 13.5', 'MCV < 80', 'Ferritin < 24'],
          disclaimer: 'Clinical observation. Requires correlation by authorized medical practitioner.'
        }
      ];
    } else {
      // Metabolic Panel
      processedResults = [
        {
          test_name: 'Fasting Blood Glucose',
          value: 142,
          unit: 'mg/dL',
          reference_range: '70 - 99',
          status: 'HIGH',
          clinical_note: 'Exceeds standard fasting glycemic benchmark.'
        },
        {
          test_name: 'HbA1c (Glycated Hemoglobin)',
          value: 7.4,
          unit: '%',
          reference_range: '4.0 - 5.6',
          status: 'HIGH',
          clinical_note: 'Significantly elevated 3-month glycemic marker.'
        },
        {
          test_name: 'Serum Creatinine',
          value: 0.85,
          unit: 'mg/dL',
          reference_range: '0.6 - 1.2',
          status: 'NORMAL',
          clinical_note: 'Glomerular filtration marker normal.'
        },
        {
          test_name: 'Blood Urea Nitrogen (BUN)',
          value: 15,
          unit: 'mg/dL',
          reference_range: '7 - 20',
          status: 'NORMAL',
          clinical_note: 'Normal physiologic range.'
        }
      ];

      processedFindings = [
        {
          id: 'FIND-MET-01',
          title: 'Significant Fasting Hyperglycemia & Elevated HbA1c',
          severity: 'ATTENTION',
          detail: 'Combined elevations in Fasting Glucose (142 mg/dL) and HbA1c (7.4%) indicate sustained hyperglycemia.'
        }
      ];

      processedPatterns = [
        {
          id: 'PAT-MET-01',
          pattern_name: 'Sustained Glycemic Dysregulation Pattern',
          confidence_level: 'HIGH',
          evidence_keys: ['Glucose HIGH', 'HbA1c HIGH'],
          disclaimer: 'Clinical pattern derived from laboratory observations. Not intended to replace a medical doctor consultation or diagnosis.'
        }
      ];
    }

    const updated = {
      ...current,
      status: 'PENDING', // Ready for Lab Review before Publish (Section 10.4)
      processing_metadata: {
        ...current.processing_metadata,
        processing_stage: 'COMPLETED',
        parsed_at: new Date().toISOString(),
        validated_at: new Date().toISOString()
      },
      results: processedResults,
      findings: processedFindings,
      patterns: processedPatterns
    };

    reports[reportIndex] = updated;
    setStoreItem(STORAGE_KEYS.REPORTS, reports);

    return updated;
  },

  // 8. Lab Review & Publish (Section 10.4 & 18: PENDING -> PUBLISHED)
  publishReport: async (reportId, labId, labSignoffName) => {
    await delay(300);
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);

    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    const report = reports[reportIndex];
    if (report.lab_id !== labId) {
      return { success: false, error: 'Unauthorized to publish report from another laboratory.', forbidden: true };
    }

    const now = new Date().toISOString();
    const updated = {
      ...report,
      status: 'PUBLISHED',
      published_at: now,
      version_history: [
        ...report.version_history,
        {
          version: report.version,
          status: 'PUBLISHED',
          timestamp: now,
          author: labSignoffName || 'Authorized Laboratory Signatory',
          notes: 'Report verified and officially published to patient platform identity.'
        }
      ]
    };

    reports[reportIndex] = updated;
    setStoreItem(STORAGE_KEYS.REPORTS, reports);

    logAuditEvent('LABORATORY', labId, report.patient_id, 'published', { report_id: reportId });

    return {
      success: true,
      report: updated,
      message: 'Report successfully published. It is now visible to the patient.'
    };
  },

  // 9. Correct Report (Section 5, 8.2, 12.33-34: Creates versions instead of overwriting)
  correctReport: async (reportId, labId, { reason, correctedResults, authorName }) => {
    await delay(350);
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);

    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    const report = reports[reportIndex];
    if (report.lab_id !== labId) {
      return { success: false, error: 'Only the originating laboratory can issue corrections.', forbidden: true };
    }

    const nextVersion = (report.version || 1) + 1;
    const now = new Date().toISOString();

    const updated = {
      ...report,
      version: nextVersion,
      status: 'CORRECTED',
      results: correctedResults || report.results,
      version_history: [
        ...report.version_history,
        {
          version: nextVersion,
          status: 'CORRECTED',
          timestamp: now,
          author: authorName || 'Senior Clinical Pathologist',
          notes: reason || `Correction issued for Version ${report.version}`
        }
      ]
    };

    reports[reportIndex] = updated;
    setStoreItem(STORAGE_KEYS.REPORTS, reports);

    logAuditEvent('LABORATORY', labId, report.patient_id, 'corrected', {
      report_id: reportId,
      new_version: nextVersion,
      reason
    });

    return {
      success: true,
      report: updated,
      message: `Version ${nextVersion} issued as CORRECTED. Full version history retained.`
    };
  },

  // 10. Withdraw Report (Section 5 & 18)
  withdrawReport: async (reportId, labId, reason) => {
    await delay(300);
    const reports = getStoreItem(STORAGE_KEYS.REPORTS) || [];
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);

    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    const report = reports[reportIndex];
    if (report.lab_id !== labId) {
      return { success: false, error: 'Only the originating laboratory can withdraw reports.', forbidden: true };
    }

    const now = new Date().toISOString();
    const updated = {
      ...report,
      status: 'WITHDRAWN',
      version_history: [
        ...report.version_history,
        {
          version: report.version,
          status: 'WITHDRAWN',
          timestamp: now,
          author: 'Laboratory Quality Assurance',
          notes: reason || 'Withdrawn from active clinical use by laboratory.'
        }
      ]
    };

    reports[reportIndex] = updated;
    setStoreItem(STORAGE_KEYS.REPORTS, reports);

    logAuditEvent('LABORATORY', labId, report.patient_id, 'withdrawn', {
      report_id: reportId,
      reason
    });

    return {
      success: true,
      report: updated,
      message: 'Report status marked as WITHDRAWN. Audit history preserved.'
    };
  },

  // 11. Retrieve audit logs for security / compliance view
  getAuditLogs: async (labId) => {
    await delay(150);
    const logs = getStoreItem(STORAGE_KEYS.ACCESS_LOGS) || [];
    return logs.filter((l) => l.actor_id === labId);
  }
};
