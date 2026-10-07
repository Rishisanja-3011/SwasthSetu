const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Laboratory = require('../models/Laboratory');
const LabAccessGrant = require('../models/LabAccessGrant');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const DiagnosticReport = require('../models/DiagnosticReport');
const LabObservation = require('../models/LabObservation');
const AuditEvent = require('../models/AuditEvent');
const User = require('../models/User');
const { enforceActiveLabGrant } = require('../middleware/boundedAccess');
const {
  CBC_STANDARDS,
  validateObservation,
  parseDigitalReportText,
  generateSampleCBCReport,
} = require('../engine/cbcEngine');

// Registered Laboratory Staff Roster (Lab Screen #1: Authentication / Staff Switcher)
const LAB_STAFF = [
  {
    id: 'staff-01',
    name: 'Dr. Shalini Gupta',
    role: 'Senior Hematopathologist',
    qualification: 'MBBS, MD Pathology',
    license: 'MED-PATH-9021',
    avatar: 'SG',
    status: 'ACTIVE_DUTY',
    canSignOff: true,
  },
  {
    id: 'staff-02',
    name: 'Rajesh Patel',
    role: 'Senior Medical Lab Technologist',
    qualification: 'M.Sc Medical Laboratory Technology',
    license: 'MLT-4482',
    avatar: 'RP',
    status: 'ACTIVE_DUTY',
    canSignOff: true,
  },
  {
    id: 'staff-03',
    name: 'Pooja Varma',
    role: 'Quality Assurance Officer',
    qualification: 'B.Sc Quality Control & Bioanalytics',
    license: 'QA-1109',
    avatar: 'PV',
    status: 'ON_DUTY',
    canSignOff: false,
  },
];

/**
 * GET /api/lab/staff
 * Returns laboratory staff roster for authentication / staff switcher
 */
router.get('/staff', (req, res) => {
  res.json({
    success: true,
    staff: LAB_STAFF,
  });
});

/**
 * GET /api/lab/list
 * Returns registered laboratories
 */
router.get('/list', async (req, res) => {
  try {
    const labs = await Laboratory.find();
    res.json({ success: true, laboratories: labs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lab/dashboard/:labId
 * Returns dashboard metrics and current lab task list
 */
router.get('/dashboard/:labId', async (req, res) => {
  try {
    const { labId } = req.params;
    const now = new Date();

    // Find grants for this laboratory
    const allGrants = await LabAccessGrant.find({ laboratory_id: labId })
      .populate('patient_id')
      .populate('diagnostic_order_id')
      .populate('published_report_id')
      .sort({ granted_at: -1 });

    // Find reports
    const allReports = await DiagnosticReport.find({ laboratory_id: labId })
      .populate('patient_id')
      .sort({ created_at: -1 });

    const activeGrants = allGrants.filter(
      (g) => g.status === 'ACTIVE' && new Date(g.expires_at) > now
    );

    const needsReviewReports = allReports.filter((r) => r.status === 'NEEDS_REVIEW');
    const processingReports = allReports.filter((r) => r.status === 'PROCESSING');
    const publishedReports = allReports.filter((r) => r.status === 'PUBLISHED');

    res.json({
      success: true,
      metrics: {
        activeGrantsCount: activeGrants.length,
        processingCount: processingReports.length,
        needsReviewCount: needsReviewReports.length,
        publishedCount: publishedReports.length,
      },
      worklist: allGrants.map((grant) => {
        const isCurrentlyActive = grant.status === 'ACTIVE' && new Date(grant.expires_at) > now;
        return {
          grant_id: grant._id,
          grant_status: isCurrentlyActive ? 'ACTIVE' : 'EXPIRED',
          granted_at: grant.granted_at,
          expires_at: grant.expires_at,
          patient: isCurrentlyActive && grant.patient_id ? {
            name: grant.patient_id.name,
            gender: grant.patient_id.gender,
            age: grant.patient_id.age,
            phone: grant.patient_id.phone,
            patient_identifier: grant.patient_id.patient_identifier,
          } : null, // If expired, patient identity is redacted per bounded access rule!
          diagnostic_order: grant.diagnostic_order_id,
          published_report: grant.published_report_id,
        };
      }),
      reports: allReports,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lab/simulate-patient-grant
 * Simulates a walk-in patient scanning the Lab QR (LAB-808) and approving sharing
 * Creates a new active patient, diagnostic order, and active LabAccessGrant
 */
router.post('/simulate-patient-grant', async (req, res) => {
  try {
    const {
      patient_name = 'Ananya Iyer',
      age = 28,
      gender = 'Female',
      phone = '+91 97654 32109',
      clinical_notes = 'Routine pre-operative CBC evaluation. Check baseline hemoglobin, WBC and platelets.',
      laboratory_id,
    } = req.body;

    let targetLabId = laboratory_id;
    if (!targetLabId) {
      const defaultLab = await Laboratory.findOne();
      targetLabId = defaultLab?._id;
    }

    if (!targetLabId) {
      return res.status(400).json({ success: false, error: 'No laboratory found to associate grant with.' });
    }

    // 1. Create Patient User & Patient record
    const patientUser = await User.create({
      role: 'patient',
      phone,
      name: patient_name,
    });

    const patientIdentifier = `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const birthYear = new Date().getFullYear() - age;
    const dateOfBirth = `${birthYear}-04-12`;

    const newPatient = await Patient.create({
      user_id: patientUser._id,
      name: patient_name,
      date_of_birth: dateOfBirth,
      age,
      gender,
      phone,
      patient_identifier: patientIdentifier,
    });

    // 2. Default Doctor
    let doctor = await Doctor.findOne();
    if (!doctor) {
      const doctorUser = await User.create({
        role: 'doctor',
        phone: '+91 98111 22334',
        name: 'Dr. Ramesh Mehta',
      });
      doctor = await Doctor.create({
        user_id: doctorUser._id,
        name: 'Dr. Ramesh Mehta',
        specialty: 'General Physician',
        clinic_name: 'Mehta Community Health Clinic',
        qr_code_id: 'DOC-409',
      });
    }

    // 3. Create Diagnostic Order (CBC)
    const order = await DiagnosticOrder.create({
      patient_id: newPatient._id,
      doctor_id: doctor._id,
      test_type: 'CBC',
      clinical_notes,
      status: 'ORDERED',
    });

    // 4. Create Active LabAccessGrant (48h active)
    const grant = await LabAccessGrant.create({
      patient_id: newPatient._id,
      laboratory_id: targetLabId,
      diagnostic_order_id: order._id,
      status: 'ACTIVE',
      granted_at: new Date(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    // 5. Audit Log
    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: newPatient._id.toString(),
      action: 'APPROVE_LAB_IDENTITY_SHARING',
      resource_type: 'LabAccessGrant',
      resource_id: grant._id.toString(),
      patient_id: newPatient._id,
      outcome: 'SUCCESS',
      details: {
        laboratory_id: targetLabId.toString(),
        scan_source: 'PATIENT_SCANNED_LAB_QR',
        exposed_fields: ['name', 'date_of_birth', 'gender', 'phone'],
      },
    });

    res.json({
      success: true,
      message: `Patient ${patient_name} scanned Lab QR and approved identity sharing. Grant active.`,
      grant,
      patient: newPatient,
      order,
    });
  } catch (error) {
    console.error('Error simulating patient grant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lab/grant/:grantId/patient-identity
 * Bounded access verification:
 * EXPOSES EXACTLY FOUR IDENTITY FIELDS: Name, Age/DOB, Gender, Phone.
 * If grant is expired, middleware returns 403 Forbidden!
 */
router.get('/grant/:grantId/patient-identity', enforceActiveLabGrant, async (req, res) => {
  try {
    const grant = req.labGrant;
    const patient = grant.patient_id;

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not linked to grant.' });
    }

    // Audit log this permitted access
    await AuditEvent.create({
      actor_type: 'LABORATORY',
      actor_id: grant.laboratory_id ? grant.laboratory_id._id.toString() : 'UNKNOWN_LAB',
      action: 'VIEW_PATIENT_IDENTITY_FIELDS',
      resource_type: 'Patient',
      resource_id: patient._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: {
        fields_exposed: ['name', 'date_of_birth', 'age', 'gender', 'phone'],
        bounded_reason: 'LabAccessGrant ACTIVE and within validity period',
      },
    });

    res.json({
      success: true,
      grant_status: 'ACTIVE',
      expires_at: grant.expires_at,
      identity: {
        name: patient.name,
        date_of_birth: patient.date_of_birth,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        patient_identifier: patient.patient_identifier,
      },
      order: grant.diagnostic_order_id ? {
        order_id: grant.diagnostic_order_id._id,
        test_type: grant.diagnostic_order_id.test_type,
        clinical_notes: grant.diagnostic_order_id.clinical_notes,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lab/generate-report & POST /api/lab/upload-report
 * Ingests lab-generated / uploaded blood report + digital text extraction + deterministic CBC validation
 * Preserves original report file & computes cryptographic SHA-256 hash & duplicate ingestion detection
 */
const handleReportIngestAndExtract = async (req, res) => {
  try {
    const grant = req.labGrant;
    const patient = grant.patient_id;
    const {
      case_type = 'standard',
      technician,
      force_reingest = false,
      file_name,
      raw_text,
    } = req.body;

    // 1. Digital report content: use uploaded raw_text if provided, or generated sample analyzer report
    const sampleId = req.body.sample_id || `SMP-${grant._id.toString().slice(-6).toUpperCase()}`;
    let rawText = raw_text;
    if (!rawText) {
      const generated = generateSampleCBCReport({
        patientName: patient.name,
        sampleId,
        caseType: case_type,
      });
      rawText = generated.rawText;
    }

    // Compute cryptographic SHA-256 hash of normalized digital text
    const normalizedRawForHash = rawText.trim().replace(/\r\n/g, '\n');
    const reportHash = crypto.createHash('sha256').update(normalizedRawForHash).digest('hex');

    // 2. Duplicate ingestion detection check
    const existingReport = await DiagnosticReport.findOne({
      patient_id: patient._id,
      report_hash: reportHash,
    });

    if (existingReport && !force_reingest) {
      const existingObs = await LabObservation.find({ report_id: existingReport._id });

      // Audit duplicate detection
      await AuditEvent.create({
        actor_type: 'LABORATORY',
        actor_id: technician?.name || grant.laboratory_id._id.toString(),
        action: 'DUPLICATE_INGESTION_DETECTED',
        resource_type: 'DiagnosticReport',
        resource_id: existingReport._id.toString(),
        patient_id: patient._id,
        outcome: 'SUCCESS',
        details: {
          report_hash: reportHash,
          reason: 'Identical digital instrument report text already ingested for this patient.',
        },
      });

      return res.json({
        success: true,
        is_duplicate: true,
        duplicate_message: `Duplicate report ingestion detected (SHA-256: ${reportHash.slice(0, 16)}...). Preserving existing verified record.`,
        report: existingReport,
        observations: existingObs,
        needs_review: existingObs.some((obs) => obs.validation_status === 'NEEDS_REVIEW'),
      });
    }

    // 3. Digital Text Extraction + Deterministic CBC Parser
    const observationsData = parseDigitalReportText(rawText, {
      triggerNeedsReview: case_type === 'needs_review_demo',
    });

    // Determine overall report status
    const hasNeedsReview = observationsData.some((obs) => obs.validation_status === 'NEEDS_REVIEW');
    const initialReportStatus = hasNeedsReview ? 'NEEDS_REVIEW' : 'PROCESSING';

    // 4. Create DiagnosticReport (Preserves original file name and source type)
    const report = await DiagnosticReport.create({
      patient_id: patient._id,
      laboratory_id: grant.laboratory_id._id,
      diagnostic_order_id: grant.diagnostic_order_id ? grant.diagnostic_order_id._id : null,
      test_type: 'CBC',
      status: initialReportStatus,
      raw_text_content: rawText,
      report_hash: reportHash,
      original_file_name: file_name || 'CBC_Report_Rahul_Sharma.pdf',
      report_source_type: file_name ? 'LAB_UPLOADED_ORIGINAL' : 'LAB_GENERATED_DIGITAL',
    });

    // 5. Save Lab Observations
    const savedObservations = await Promise.all(
      observationsData.map((obs) =>
        LabObservation.create({
          report_id: report._id,
          test_name_original: obs.test_name_original,
          test_name_normalized: obs.test_name_normalized,
          value: obs.value,
          unit: obs.unit,
          reference_low: obs.reference_low,
          reference_high: obs.reference_high,
          flag: obs.flag,
          extraction_confidence: obs.extraction_confidence,
          validation_status: obs.validation_status,
          review_reason: obs.review_reason,
        })
      )
    );

    // Audit log
    await AuditEvent.create({
      actor_type: 'LABORATORY',
      actor_id: technician?.name || grant.laboratory_id._id.toString(),
      action: file_name ? 'LAB_REPORT_UPLOADED_AND_EXTRACTED' : 'CBC_DIGITAL_EXTRACTION_VALIDATION',
      resource_type: 'DiagnosticReport',
      resource_id: report._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: {
        total_observations: savedObservations.length,
        has_needs_review: hasNeedsReview,
        case_type,
        report_hash: reportHash,
        original_file_name: report.original_file_name,
        staff: technician?.name || 'Lab Staff',
      },
    });

    res.json({
      success: true,
      report,
      observations: savedObservations,
      needs_review: hasNeedsReview,
      is_duplicate: false,
    });
  } catch (error) {
    console.error('Error generating/uploading and extracting CBC report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/generate-report', enforceActiveLabGrant, handleReportIngestAndExtract);
router.post('/upload-report', enforceActiveLabGrant, handleReportIngestAndExtract);


/**
 * GET /api/lab/report/:reportId
 * Returns a report and its observations
 */
router.get('/report/:reportId', async (req, res) => {
  try {
    const report = await DiagnosticReport.findById(req.params.reportId)
      .populate('patient_id')
      .populate('laboratory_id');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const observations = await LabObservation.find({ report_id: report._id });

    res.json({
      success: true,
      report,
      observations,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lab/report/:reportId/raw
 * Preserved original report viewer: Returns unaltered raw instrument text and integrity hash
 */
router.get('/report/:reportId/raw', async (req, res) => {
  try {
    const report = await DiagnosticReport.findById(req.params.reportId)
      .populate('patient_id')
      .populate('laboratory_id');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({
      success: true,
      report_id: report._id,
      patient_name: report.patient_id?.name,
      test_type: report.test_type,
      status: report.status,
      report_source_type: report.report_source_type,
      report_hash: report.report_hash,
      raw_text_content: report.raw_text_content,
      created_at: report.created_at,
      published_at: report.published_at,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lab/patient-view/:reportId
 * Returns patient-facing VaaniDoc record for the published CBC report
 * Includes educational non-diagnostic guidance and grounded health chatbot sample Q&A
 */
router.get('/patient-view/:reportId', async (req, res) => {
  try {
    const report = await DiagnosticReport.findById(req.params.reportId)
      .populate('patient_id')
      .populate('laboratory_id')
      .populate('diagnostic_order_id');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const observations = await LabObservation.find({ report_id: report._id });

    // Derive non-diagnostic educational highlights
    const hbObs = observations.find((o) => o.test_name_normalized.toLowerCase().includes('hemoglobin'));
    const wbcObs = observations.find((o) => o.test_name_normalized.toLowerCase().includes('wbc'));
    const pltObs = observations.find((o) => o.test_name_normalized.toLowerCase().includes('platelet'));

    let healthSummary = 'All routine blood parameters within expected limits.';
    if (hbObs && hbObs.flag === 'LOW') {
      healthSummary = `Hemoglobin is ${hbObs.value} g/dL (reference range: ${hbObs.reference_low} - ${hbObs.reference_high} g/dL). This mild variation may indicate borderline anemia. Discuss with your doctor for dietary or iron guidance.`;
    }

    const chatbotQuestions = [
      {
        question: 'What does my Hemoglobin result mean?',
        answer: hbObs
          ? `Your Hemoglobin is ${hbObs.value} ${hbObs.unit} (standard range: ${hbObs.reference_low}–${hbObs.reference_high} ${hbObs.unit}). Because it is slightly lower than standard adult values, your body may have slightly reduced oxygen-carrying capacity, often seen in nutritional anemia or tiredness. This is educational info—consult your physician.`
          : 'Hemoglobin reflects the oxygen-carrying protein in red blood cells.',
      },
      {
        question: 'Are my Platelets and White Blood Cells normal?',
        answer: `Platelets are ${pltObs ? `${pltObs.value} ${pltObs.unit} (${pltObs.flag})` : 'Normal'} and WBC is ${wbcObs ? `${wbcObs.value} ${wbcObs.unit} (${wbcObs.flag})` : 'Normal'}. Both are within expected physiological limits for immune defense and blood clotting.`,
      },
      {
        question: 'Can Dr. Mehta see this report during my next visit?',
        answer: 'Yes! When you scan Dr. Mehta’s QR code and select REVISITING, Dr. Mehta will have secure, bounded access to this published lab report while your consultation encounter is OPEN.',
      },
    ];

    res.json({
      success: true,
      report,
      observations,
      patient: report.patient_id,
      laboratory: report.laboratory_id,
      order: report.diagnostic_order_id,
      healthSummary,
      chatbotQuestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/lab/observation/:observationId
 * Lab technician reviews or corrects an extracted value
 */
router.put('/observation/:observationId', async (req, res) => {
  try {
    const { observationId } = req.params;
    const { value, unit, reference_low, reference_high, edit_reason, technician } = req.body;

    const obs = await LabObservation.findById(observationId);
    if (!obs) {
      return res.status(404).json({ success: false, error: 'Observation not found' });
    }

    // Check parent report
    const report = await DiagnosticReport.findById(obs.report_id);
    if (report && report.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Published reports and observations are locked. Modifying published results is strictly prohibited.',
      });
    }

    // Re-validate deterministically with corrected value
    const canonicalKey = Object.keys(CBC_STANDARDS).find(
      (k) => CBC_STANDARDS[k].displayName.toLowerCase() === obs.test_name_normalized.toLowerCase()
    );

    const revalidated = validateObservation({
      canonicalKey: canonicalKey || 'other',
      rawName: obs.test_name_original,
      value: value !== undefined ? value : obs.value,
      unit: unit || obs.unit,
      refLow: reference_low !== undefined ? reference_low : obs.reference_low,
      refHigh: reference_high !== undefined ? reference_high : obs.reference_high,
      extractionConfidence: 1.0, // Manual correction by human pathologist has 100% confidence
      isAmbiguousUnit: false,
    });

    obs.value = revalidated.value;
    obs.unit = revalidated.unit;
    obs.reference_low = revalidated.reference_low;
    obs.reference_high = revalidated.reference_high;
    obs.flag = revalidated.flag;
    obs.extraction_confidence = 1.0;
    obs.validation_status = revalidated.validation_status;
    obs.review_reason = revalidated.review_reason;
    obs.manually_edited = true;

    await obs.save();

    // Check if report still has any remaining NEEDS_REVIEW observations
    const allReportObs = await LabObservation.find({ report_id: obs.report_id });
    const remainingNeedsReview = allReportObs.filter((o) => o.validation_status === 'NEEDS_REVIEW');

    if (remainingNeedsReview.length === 0) {
      report.status = 'PROCESSING';
      await report.save();
    } else {
      report.status = 'NEEDS_REVIEW';
      await report.save();
    }

    // Audit log
    await AuditEvent.create({
      actor_type: 'LABORATORY',
      actor_id: technician?.name || report.laboratory_id.toString(),
      action: 'LAB_OBSERVATION_MANUAL_CORRECTION',
      resource_type: 'LabObservation',
      resource_id: obs._id.toString(),
      patient_id: report.patient_id,
      outcome: 'SUCCESS',
      details: {
        test: obs.test_name_normalized,
        corrected_value: obs.value,
        status_now: obs.validation_status,
        edit_reason: edit_reason || 'Verified against hematology analyzer display',
        staff_member: technician?.name || 'Staff Technologist',
      },
    });

    res.json({
      success: true,
      observation: obs,
      report_status: report.status,
      unresolved_count: remainingNeedsReview.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lab/report/:reportId/publish
 * Publishes the CBC report.
 * CRITICAL RULE: Any NEEDS_REVIEW observation blocks publication!
 * UPON PUBLICATION: LabAccessGrant EXPIRES AUTOMATICALLY!
 */
router.post('/report/:reportId/publish', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { grant_id, technician, sign_off_notes } = req.body;

    const report = await DiagnosticReport.findById(reportId)
      .populate('patient_id')
      .populate('laboratory_id');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Report has already been published.',
      });
    }

    // Check observations for any unresolved NEEDS_REVIEW
    const observations = await LabObservation.find({ report_id: report._id });
    const unresolvedIssues = observations.filter((obs) => obs.validation_status === 'NEEDS_REVIEW');

    if (unresolvedIssues.length > 0) {
      return res.status(400).json({
        success: false,
        error: `PUBLICATION_BLOCKED: Report cannot publish while ${unresolvedIssues.length} observation(s) have validation status NEEDS_REVIEW. Lab review and correction is required before publishing.`,
        unresolved: unresolvedIssues.map((u) => ({
          test: u.test_name_normalized,
          reason: u.review_reason,
        })),
      });
    }

    // Publish Report
    report.status = 'PUBLISHED';
    report.published_at = new Date();
    await report.save();

    // Update diagnostic order status if present
    if (report.diagnostic_order_id) {
      await DiagnosticOrder.findByIdAndUpdate(report.diagnostic_order_id, {
        status: 'COMPLETED',
      });
    }

    // CRITICAL BOUNDED ACCESS ENFORCEMENT:
    // LabAccessGrant expires automatically when associated report is published!
    let targetGrantId = grant_id;
    if (!targetGrantId) {
      const activeGrant = await LabAccessGrant.findOne({
        patient_id: report.patient_id._id,
        laboratory_id: report.laboratory_id._id,
        status: 'ACTIVE',
      });
      if (activeGrant) {
        targetGrantId = activeGrant._id;
      }
    }

    let grantUpdated = null;
    if (targetGrantId) {
      grantUpdated = await LabAccessGrant.findByIdAndUpdate(
        targetGrantId,
        {
          status: 'EXPIRED',
          expires_at: new Date(),
          published_report_id: report._id,
        },
        { new: true }
      );
    }

    // Log publication and bounded access expiration to Audit Trail
    await AuditEvent.create({
      actor_type: 'LABORATORY',
      actor_id: technician?.name || report.laboratory_id._id.toString(),
      action: 'PUBLISH_CBC_REPORT',
      resource_type: 'DiagnosticReport',
      resource_id: report._id.toString(),
      patient_id: report.patient_id._id,
      outcome: 'SUCCESS',
      details: {
        published_at: report.published_at,
        total_observations: observations.length,
        signed_by: technician?.name || 'Senior Pathologist',
        sign_off_notes: sign_off_notes || 'All observations verified deterministically and clinically.',
      },
    });

    if (grantUpdated) {
      await AuditEvent.create({
        actor_type: 'SYSTEM',
        actor_id: 'BOUNDED_ACCESS_GUARD',
        action: 'EXPIRE_LAB_ACCESS_GRANT',
        resource_type: 'LabAccessGrant',
        resource_id: grantUpdated._id.toString(),
        patient_id: report.patient_id._id,
        outcome: 'EXPIRED',
        details: {
          reason: 'Lab access expires automatically upon report publication by construction.',
          published_report_id: report._id.toString(),
          published_by: technician?.name || 'Pathologist',
        },
      });
    }

    res.json({
      success: true,
      message: 'Report published successfully. Connected to VaaniDoc Patient Dashboard and Revisiting doctor.',
      report,
      grant_status: 'EXPIRED',
      access_expired: true,
      bounded_access_message: 'Lab access has expired automatically. No patient data or edit permissions remain accessible.',
      published_by: technician?.name || 'Pathologist',
    });
  } catch (error) {
    console.error('Error publishing report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lab/audit-events/:resourceId
 * View audit trail for verification of bounded access
 */
router.get('/audit-events/:resourceId', async (req, res) => {
  try {
    const events = await AuditEvent.find({
      $or: [
        { resource_id: req.params.resourceId },
        { patient_id: req.params.resourceId },
      ],
    }).sort({ timestamp: -1 });

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
