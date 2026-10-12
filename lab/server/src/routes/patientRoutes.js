const express = require('express');
const mongoose = require('mongoose');

const {
  Patient,
  Doctor,
  Laboratory,
  Encounter,
  SymptomIntake,
  LabAccessGrant,
  DiagnosticReport,
  ReportFile,
  LabObservation,
  DiagnosticOrder,
  AuditEvent,
  AIArtifact,
  ConsultationNote,
  Notification,
} = require('../models');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { publicProvider, resolveProvider } = require('../services/providerService');
const { downloadOriginalPdf } = require('../services/reportFiles');

const router = express.Router();

router.use(requireAuth, requireRole('PATIENT'));

async function getAuthenticatedPatient(req) {
  return Patient.findOne({ user_id: req.auth.sub });
}

function reportIdentifier(report) {
  return `CBC-${String(report._id).slice(-6).toUpperCase()}`;
}

function isValidObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function explanationForObservation(observation) {
  if (observation.reference_low === null || observation.reference_high === null) {
    return `Your ${observation.test_name_normalized} was ${observation.value} ${observation.unit || ''}. The laboratory did not provide a reference range.`.trim();
  }
  const position = observation.flag === 'HIGH'
    ? 'above'
    : observation.flag === 'LOW'
      ? 'below'
      : 'within';
  return `Your ${observation.test_name_normalized} was ${observation.value} ${observation.unit || ''}. The laboratory reference range is ${observation.reference_low}–${observation.reference_high} ${observation.unit || ''}. This is ${position} that range.`.trim();
}

async function toReportResponse(report) {
  const [observations, file, order] = await Promise.all([
    LabObservation.find({ report_id: report._id }).sort({ created_at: 1 }),
    ReportFile.findOne({ report_id: report._id }),
    DiagnosticOrder.findById(report.diagnostic_order_id).populate('doctor_id'),
  ]);

  return {
    _id: report._id,
    report_identifier: reportIdentifier(report),
    patient_name: report.patient_id?.name,
    patient_identifier: report.patient_id?.patient_identifier,
    laboratory_name: report.laboratory_id?.name,
    laboratory_code: report.laboratory_id?.qr_code_id,
    ordering_doctor: order?.doctor_id?.name
      ? `${order.doctor_id.name} (${order.doctor_id.qr_code_id})`
      : 'Registered Doctor',
    test_type: report.test_type,
    status: report.status,
    created_at: report.created_at,
    published_at: report.published_at,
    original_file_name: file?.original_file_name || report.original_file_name,
    original_file_available: Boolean(file),
    original_file_url: file ? `/api/patient/reports/${report._id}/original` : null,
    report_hash: file?.sha256 || report.report_hash,
    observations: observations.map((observation) => ({
      _id: observation._id,
      test_name_original: observation.test_name_original,
      test_name_normalized: observation.test_name_normalized,
      value: observation.value,
      unit: observation.unit,
      reference_low: observation.reference_low,
      reference_high: observation.reference_high,
      flag: observation.flag,
      validation_status: observation.validation_status,
      confidence: observation.extraction_confidence,
      explanation: explanationForObservation(observation),
    })),
  };
}

function timelineEvent({ id, type, title, subtitle, timestamp, badge, details }) {
  return { id: String(id), type, title, subtitle, timestamp, badge, details };
}

router.get('/reports', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });

    const reports = await DiagnosticReport.find({
      patient_id: patient._id,
      status: 'PUBLISHED',
    })
      .populate('patient_id laboratory_id')
      .sort({ published_at: -1 });

    return res.json({
      success: true,
      reports: await Promise.all(reports.map(toReportResponse)),
    });
  } catch (error) {
    console.error('Patient report list error:', error);
    return res.status(500).json({ success: false, error: 'PATIENT_REPORTS_FAILED' });
  }
});

router.get('/reports/:reportId', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient || !isValidObjectId(req.params.reportId)) {
      return res.status(404).json({ success: false, error: 'PUBLISHED_REPORT_NOT_FOUND' });
    }
    const report = await DiagnosticReport.findOne({
      _id: req.params.reportId,
      patient_id: patient?._id,
      status: 'PUBLISHED',
    }).populate('patient_id laboratory_id');

    if (!report) return res.status(404).json({ success: false, error: 'PUBLISHED_REPORT_NOT_FOUND' });

    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: patient._id.toString(),
      action: 'PATIENT_VIEWED_PUBLISHED_REPORT',
      resource_type: 'DiagnosticReport',
      resource_id: report._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
    });

    return res.json({ success: true, report: await toReportResponse(report) });
  } catch (error) {
    console.error('Patient report detail error:', error);
    return res.status(500).json({ success: false, error: 'PATIENT_REPORT_FAILED' });
  }
});

router.get('/reports/:reportId/original', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient || !isValidObjectId(req.params.reportId)) {
      return res.status(404).json({ success: false, error: 'PUBLISHED_REPORT_NOT_FOUND' });
    }
    const report = await DiagnosticReport.findOne({
      _id: req.params.reportId,
      patient_id: patient._id,
      status: 'PUBLISHED',
    });
    const originalFile = report ? await ReportFile.findOne({ report_id: report._id }) : null;
    if (!report || !originalFile) {
      return res.status(404).json({ success: false, error: 'ORIGINAL_REPORT_FILE_NOT_FOUND' });
    }

    return downloadOriginalPdf(res, originalFile);
  } catch (error) {
    console.error('Patient original report download error:', error);
    return res.status(500).json({ success: false, error: 'ORIGINAL_REPORT_DOWNLOAD_FAILED' });
  }
});

router.get('/lab-grants', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });

    const grants = await LabAccessGrant.find({ patient_id: patient._id })
      .populate('laboratory_id')
      .sort({ _id: -1 });

    return res.json({
      success: true,
      grants: grants.map((grant) => ({
        id: grant._id,
        patient_id: patient._id,
        laboratory_id: grant.laboratory_id?._id,
        laboratory_name: grant.laboratory_id?.name,
        laboratory_code: grant.laboratory_id?.qr_code_id,
        shared_fields: grant.shared_fields,
        status: grant.status,
        diagnostic_order_id: grant.diagnostic_order_id,
        published_report_id: grant.published_report_id,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'PATIENT_GRANTS_FAILED' });
  }
});

router.post('/lab-grants', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    const provider = await resolveProvider(req.body.laboratory_code);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
    if (!provider || provider.provider_type !== 'LABORATORY') {
      return res.status(400).json({ success: false, error: 'LABORATORY_NOT_FOUND_OR_UNAPPROVED' });
    }

    let orderId = req.body.diagnostic_order_id || null;
    if (orderId && (!isValidObjectId(orderId) || !await DiagnosticOrder.exists({
      _id: orderId, patient_id: patient._id, status: 'ORDERED',
    }))) {
      return res.status(400).json({ success: false, error: 'INVALID_DIAGNOSTIC_ORDER' });
    }
    if (!orderId) {
      const latestOrder = await DiagnosticOrder.findOne({ patient_id: patient._id, status: 'ORDERED' })
        .sort({ created_at: -1 })
        .select('_id');
      orderId = latestOrder?._id || null;
    }

    const existing = await LabAccessGrant.findOne({
      patient_id: patient._id,
      laboratory_id: provider.provider_id,
      status: 'ACTIVE',
    });
    if (existing) {
      return res.json({ success: true, grant: existing, already_active: true });
    }

    const grant = await LabAccessGrant.create({
      patient_id: patient._id,
      laboratory_id: provider.provider_id,
      diagnostic_order_id: orderId,
      shared_fields: ['name', 'date_of_birth', 'gender', 'phone'],
      status: 'ACTIVE',
    });

    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: patient._id.toString(),
      action: 'APPROVE_LAB_IDENTITY_SHARING',
      resource_type: 'LabAccessGrant',
      resource_id: grant._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: { laboratory_code: provider.provider_code, exposed_fields: grant.shared_fields },
    });

    return res.status(201).json({
      success: true,
      grant: {
        id: grant._id,
        patient_id: patient._id,
        laboratory_id: provider.provider_id,
        laboratory_name: provider.provider.name,
         laboratory_code: provider.provider_code,
         shared_fields: grant.shared_fields,
         status: grant.status,
         diagnostic_order_id: grant.diagnostic_order_id,
       },
    });
  } catch (error) {
    console.error('Patient lab grant error:', error);
    return res.status(500).json({ success: false, error: 'LAB_GRANT_FAILED' });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });

    const [encounters, intakes, notes, orders, reports] = await Promise.all([
      Encounter.find({ patient_id: patient._id }).populate('doctor_id').sort({ created_at: -1 }),
      SymptomIntake.find({ patient_id: patient._id }).sort({ created_at: -1 }),
      ConsultationNote.find({ patient_id: patient._id }).sort({ created_at: -1 }),
      DiagnosticOrder.find({ patient_id: patient._id }).populate('doctor_id').sort({ created_at: -1 }),
      DiagnosticReport.find({ patient_id: patient._id, status: 'PUBLISHED' }).populate('laboratory_id').sort({ published_at: -1 }),
    ]);

    const intakesByEncounter = new Map(intakes.map((item) => [String(item.encounter_id), item]));
    const notesByEncounter = new Map(notes.map((item) => [String(item.encounter_id), item]));
    const ordersByEncounter = new Map();
    orders.forEach((order) => {
      const key = String(order.encounter_id);
      if (!ordersByEncounter.has(key)) ordersByEncounter.set(key, []);
      ordersByEncounter.get(key).push(order);
    });
    const reportsByOrder = new Map(reports.map((report) => [String(report.diagnostic_order_id), report]));

    const consultations = encounters.map((encounter) => {
      const encounterId = String(encounter._id);
      const intake = intakesByEncounter.get(encounterId);
      const orderDetails = (ordersByEncounter.get(encounterId) || []).map((order) => {
        const report = reportsByOrder.get(String(order._id));
        return {
          id: order._id,
          test_type: order.test_type,
          clinical_notes: order.clinical_notes,
          status: order.status,
          created_at: order.created_at,
          report: report ? {
            id: report._id,
            status: report.status,
            laboratory_name: report.laboratory_id?.name || 'Registered Laboratory',
            published_at: report.published_at,
          } : null,
        };
      });
      return timelineEvent({
        id: `consultation-${encounter._id}`,
        type: 'CONSULTATION',
        title: `${encounter.visit_type === 'REVISITING' ? 'Revisiting' : 'New'} consultation`,
        subtitle: `${encounter.doctor_id?.name || 'Doctor'} • ${encounter.status === 'CLOSED' ? 'Completed' : 'Open'}`,
        timestamp: encounter.created_at,
        badge: encounter.status,
        details: {
          encounter_id: encounter._id,
          visit_type: encounter.visit_type,
          status: encounter.status,
          created_at: encounter.created_at,
          started_at: encounter.started_at,
          ended_at: encounter.ended_at,
          doctor: encounter.doctor_id ? {
            id: encounter.doctor_id._id,
            name: encounter.doctor_id.name,
            specialty: encounter.doctor_id.specialty,
            clinic_name: encounter.doctor_id.clinic_name,
          } : null,
          intake: intake ? {
            created_at: intake.created_at,
            input_mode: intake.input_mode,
            transcript: intake.transcript,
            chief_complaint: intake.chief_complaint,
            duration: intake.duration,
            symptoms: intake.symptoms,
            structured_data: intake.structured_data,
          } : null,
          consultation_note: notesByEncounter.get(encounterId)?.notes_text || '',
          diagnostic_orders: orderDetails,
        },
      });
    });

    return res.json({ success: true, consultations });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'PATIENT_TIMELINE_FAILED' });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
    const filter = { patient_id: patient._id, type: 'DIAGNOSTIC_ORDER_CREATED' };
    const notifications = await Notification.find(filter)
      .populate('doctor_id', 'name specialty clinic_name')
      .populate('diagnostic_order_id', 'test_type clinical_notes status created_at')
      .sort({ created_at: -1 })
      .limit(30);
    return res.json({
      success: true,
      notifications,
      unread_count: await Notification.countDocuments({ ...filter, read: false }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'PATIENT_NOTIFICATIONS_FAILED' });
  }
});

router.post('/notifications/:notificationId/read', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient || !isValidObjectId(req.params.notificationId)) {
      return res.status(404).json({ success: false, error: 'NOTIFICATION_NOT_FOUND' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, patient_id: patient._id, type: 'DIAGNOSTIC_ORDER_CREATED' },
      { read: true },
      { new: true },
    );
    if (!notification) return res.status(404).json({ success: false, error: 'NOTIFICATION_NOT_FOUND' });
    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'PATIENT_NOTIFICATION_UPDATE_FAILED' });
  }
});

router.post('/notifications/read-all', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
    await Notification.updateMany({ patient_id: patient._id, type: 'DIAGNOSTIC_ORDER_CREATED', read: false }, { read: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'PATIENT_NOTIFICATION_UPDATE_FAILED' });
  }
});

router.post('/encounters', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    const provider = await resolveProvider(req.body.doctor_code);
    if (!patient) return res.status(404).json({ success: false, error: 'PATIENT_PROFILE_NOT_FOUND' });
    if (!provider || provider.provider_type !== 'DOCTOR') {
      return res.status(400).json({ success: false, error: 'DOCTOR_NOT_FOUND' });
    }
    if (!['NEW', 'REVISITING'].includes(req.body.visit_type)) {
      return res.status(400).json({ success: false, error: 'INVALID_VISIT_TYPE' });
    }

    const encounter = await Encounter.create({
      patient_id: patient._id,
      doctor_id: provider.provider_id,
      visit_type: req.body.visit_type,
      status: 'OPEN',
      queue_status: 'WAITING',
    });

    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: patient._id.toString(),
      action: 'PATIENT_OPENED_DOCTOR_ENCOUNTER',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: { doctor_code: provider.provider_code, visit_type: encounter.visit_type },
    });

    return res.status(201).json({
      success: true,
      encounter: {
        id: encounter._id,
        _id: encounter._id,
        patient_id: patient._id,
        doctor_id: provider.provider_id,
        doctor_name: provider.provider.name,
        clinic_name: provider.provider.clinic_name,
        doctor_code: provider.provider_code,
        visit_type: encounter.visit_type,
        status: encounter.status,
        lifecycle_state: 'WAITING',
        queue_number: encounter.queue_number,
        created_at: encounter.created_at,
      },
    });
  } catch (error) {
    console.error('Patient encounter creation error:', error);
    return res.status(500).json({ success: false, error: 'ENCOUNTER_CREATE_FAILED' });
  }
});

router.post('/encounters/:encounterId/intake', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient || !isValidObjectId(req.params.encounterId)) {
      return res.status(404).json({ success: false, error: 'ENCOUNTER_NOT_FOUND' });
    }
    const encounter = await Encounter.findOne({
      _id: req.params.encounterId,
      patient_id: patient?._id,
    });
    if (!encounter) return res.status(404).json({ success: false, error: 'ENCOUNTER_NOT_FOUND' });
    if (encounter.status !== 'OPEN') return res.status(403).json({ success: false, error: 'ENCOUNTER_CLOSED' });

    const inputMode = String(req.body.input_mode || '').toUpperCase();
    if (!['VOICE', 'TEXT', 'SKIPPED'].includes(inputMode)) {
      return res.status(400).json({ success: false, error: 'INVALID_INPUT_MODE' });
    }
    if (encounter.visit_type === 'NEW' && inputMode === 'SKIPPED') {
      return res.status(400).json({ success: false, error: 'NEW_CONSULTATION_INTAKE_REQUIRED' });
    }

    const structuredData = req.body.structured_data || {};
    const transcript = typeof req.body.transcript === 'string' ? req.body.transcript : '';
    if (encounter.visit_type === 'NEW' && !transcript.trim() && !structuredData.chief_complaint) {
      return res.status(400).json({ success: false, error: 'CONFIRMED_INTAKE_REQUIRED' });
    }

    const intake = await SymptomIntake.findOneAndUpdate(
      { encounter_id: encounter._id },
      {
        patient_id: patient._id,
        input_mode: inputMode,
        transcript,
        chief_complaint: structuredData.chief_complaint || '',
        duration: structuredData.duration || '',
        symptoms: Array.isArray(structuredData.symptoms) ? structuredData.symptoms : [],
        structured_data: structuredData,
        confidence: Number(req.body.confidence ?? structuredData.confidence ?? 0),
        provenance: { transcript: 'PATIENT_REPORTED', structured_data: 'AI_GENERATED' },
        confirmed_at: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AIArtifact.create({
      encounter_id: encounter._id,
      artifact_type: 'STRUCTURED_SYMPTOM_INTAKE',
      content: structuredData,
      source_reference: intake._id.toString(),
    });

    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: patient._id.toString(),
      action: 'PATIENT_CONFIRMED_SYMPTOM_INTAKE',
      resource_type: 'SymptomIntake',
      resource_id: intake._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: { input_mode: inputMode },
    });

    return res.status(201).json({ success: true, intake, encounter_id: encounter._id });
  } catch (error) {
    console.error('Patient intake error:', error);
    return res.status(500).json({ success: false, error: 'INTAKE_SUBMIT_FAILED' });
  }
});

router.get('/encounters/:encounterId', async (req, res) => {
  try {
    const patient = await getAuthenticatedPatient(req);
    if (!patient || !isValidObjectId(req.params.encounterId)) {
      return res.status(404).json({ success: false, error: 'ENCOUNTER_NOT_FOUND' });
    }
    const encounter = await Encounter.findOne({
      _id: req.params.encounterId,
      patient_id: patient?._id,
    }).populate('doctor_id');
    if (!encounter) return res.status(404).json({ success: false, error: 'ENCOUNTER_NOT_FOUND' });

    const intake = await SymptomIntake.findOne({ encounter_id: encounter._id });
    const lifecycleState = encounter.status === 'CLOSED'
      ? 'CONSULTATION_COMPLETED'
      : encounter.queue_status === 'IN_CONSULTATION'
        ? 'CONSULTATION_STARTED'
        : encounter.queue_status === 'CALLED'
          ? 'PLEASE_COME_IN'
          : encounter.queue_status;

    return res.json({
      success: true,
      encounter: {
        id: encounter._id,
        _id: encounter._id,
        patient_id: patient._id,
        doctor_id: encounter.doctor_id?._id,
        doctor_name: encounter.doctor_id?.name,
        clinic_name: encounter.doctor_id?.clinic_name,
        visit_type: encounter.visit_type,
        status: encounter.status,
        queue_status: encounter.queue_status,
        lifecycle_state: lifecycleState,
        queue_number: encounter.queue_number,
        created_at: encounter.created_at,
        started_at: encounter.started_at,
        ended_at: encounter.ended_at,
        intake,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'ENCOUNTER_LOOKUP_FAILED' });
  }
});

module.exports = router;
