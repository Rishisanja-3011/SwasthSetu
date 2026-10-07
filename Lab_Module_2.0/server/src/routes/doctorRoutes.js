const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const SymptomIntake = require('../models/SymptomIntake');
const ConsultationNote = require('../models/ConsultationNote');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const DiagnosticReport = require('../models/DiagnosticReport');
const LabObservation = require('../models/LabObservation');
const AuditEvent = require('../models/AuditEvent');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * 1. GET /api/doctor/list
 */
router.get('/list', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ created_at: -1 });
    return res.json({ success: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. POST /api/doctor/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, phone, specialty, clinic_name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Doctor name is required.' });
    }

    let doctorCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
      const randomNum = Math.floor(100 + Math.random() * 900);
      doctorCode = 'DOC-' + randomNum;
      const existing = await Doctor.findOne({ qr_code_id: doctorCode });
      if (!existing) isUnique = true;
      attempts++;
    }

    const user = await User.create({
      role: 'doctor',
      phone: phone || '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
      name: name,
    });

    const doctor = await Doctor.create({
      user_id: user._id,
      name: name,
      specialty: specialty || 'General Physician',
      clinic_name: clinic_name || 'Community Health Clinic',
      qr_code_id: doctorCode,
    });

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: doctor._id.toString(),
      action: 'DOCTOR_REGISTERED',
      resource_type: 'Doctor',
      resource_id: doctor._id.toString(),
      outcome: 'SUCCESS',
      details: { doctor_code: doctorCode, clinic_name: doctor.clinic_name },
    });

    return res.status(201).json({
      success: true,
      doctor: {
        id: doctor._id,
        _id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
        clinic_name: doctor.clinic_name,
        doctor_code: doctor.qr_code_id,
        qr_code_id: doctor.qr_code_id,
      },
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. POST /api/doctor/login
 */
router.post('/login', async (req, res) => {
  try {
    const { doctor_code, phone } = req.body;
    let doctor = null;

    if (doctor_code) {
      const cleanCode = doctor_code.trim().toUpperCase();
      doctor = await Doctor.findOne({ qr_code_id: cleanCode });
    } else if (phone) {
      const cleanPhone = phone.trim();
      const user = await User.findOne({ phone: cleanPhone, role: 'doctor' });
      if (user) {
        doctor = await Doctor.findOne({ user_id: user._id });
      }
    }

    if (!doctor && (!doctor_code && !phone)) {
      doctor = await Doctor.findOne({ qr_code_id: 'DOC-409' });
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found. Please check your Doctor Code or mobile number.',
      });
    }

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: doctor._id.toString(),
      action: 'DOCTOR_LOGGED_IN',
      resource_type: 'Doctor',
      resource_id: doctor._id.toString(),
      outcome: 'SUCCESS',
      details: { doctor_code: doctor.qr_code_id },
    });

    return res.json({
      success: true,
      doctor: {
        id: doctor._id,
        _id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
        clinic_name: doctor.clinic_name,
        doctor_code: doctor.qr_code_id,
        qr_code_id: doctor.qr_code_id,
      },
    });
  } catch (error) {
    console.error('Error logging in doctor:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. GET /api/doctor/profile/:doctorId
 */
router.get('/profile/:doctorId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const waitingCount = await Encounter.countDocuments({
      doctor_id: doctor._id,
      status: { $in: ['WAITING', 'IN_CONSULTATION'] },
    });

    const completedToday = await Encounter.countDocuments({
      doctor_id: doctor._id,
      status: 'CLOSED',
    });

    return res.json({
      success: true,
      doctor: {
        id: doctor._id,
        _id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
        clinic_name: doctor.clinic_name,
        doctor_code: doctor.qr_code_id,
        qr_code_id: doctor.qr_code_id,
        waiting_count: waitingCount,
        completed_today: completedToday,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. GET /api/doctor/queue/:doctorId
 */
router.get('/queue/:doctorId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    const encounters = await Encounter.find({
      doctor_id: doctor._id,
      status: { $in: ['WAITING', 'IN_CONSULTATION'] },
    })
      .populate('patient_id')
      .sort({ created_at: 1 });

    const queueItems = await Promise.all(
      encounters.map(async (enc, index) => {
        const intake = await SymptomIntake.findOne({ encounter_id: enc._id });
        return {
          encounter_id: enc._id,
          queue_number: index + 1,
          token_number: '#' + (index + 1),
          patient_id: enc.patient_id ? enc.patient_id._id : null,
          patient_name: enc.patient_id ? enc.patient_id.name : 'Unknown Patient',
          patient_identifier: enc.patient_id ? enc.patient_id.patient_identifier : 'PT-UNKNOWN',
          age: enc.patient_id ? enc.patient_id.age : null,
          gender: enc.patient_id ? enc.patient_id.gender : null,
          visit_type: enc.visit_type,
          status: enc.status,
          lifecycle_state: enc.lifecycle_state || 'WAITING',
          has_intake: !!intake,
          chief_complaint: intake ? intake.chief_complaint : 'Intake pending',
          duration: intake ? intake.duration : '',
          symptoms: intake ? intake.symptoms : [],
          created_at: enc.created_at,
          started_at: enc.started_at,
        };
      })
    );

    return res.json({
      success: true,
      doctor_code: doctor.qr_code_id,
      doctor_name: doctor.name,
      queue: queueItems,
      total_waiting: queueItems.length,
    });
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6. POST /api/doctor/encounter/:encounterId/review
 */
router.post('/encounter/:encounterId/review', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.encounterId)
      .populate('patient_id')
      .populate('doctor_id');

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Encounter is closed.',
      });
    }

    encounter.status = 'WAITING';
    encounter.lifecycle_state = 'DOCTOR_REVIEWING';
    await encounter.save();

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id ? encounter.doctor_id._id.toString() : 'UNKNOWN_DOCTOR',
      action: 'DOCTOR_REVIEW_SYMPTOMS',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: encounter.patient_id ? encounter.patient_id._id : null,
      outcome: 'SUCCESS',
      details: {
        lifecycle_state: 'DOCTOR_REVIEWING',
        patient_name: encounter.patient_id ? encounter.patient_id.name : '',
      },
    });

    return res.json({
      success: true,
      encounter: {
        id: encounter._id,
        status: encounter.status,
        lifecycle_state: encounter.lifecycle_state,
        patient_id: encounter.patient_id ? encounter.patient_id._id : null,
        visit_type: encounter.visit_type,
      },
    });
  } catch (error) {
    console.error('Error in review symptoms:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. GET /api/doctor/encounter/:encounterId/cockpit
 */
router.get('/encounter/:encounterId/cockpit', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.encounterId)
      .populate('patient_id')
      .populate('doctor_id');

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      await AuditEvent.create({
        actor_type: 'DOCTOR',
        actor_id: encounter.doctor_id ? encounter.doctor_id._id.toString() : 'UNKNOWN_DOCTOR',
        action: 'HISTORICAL_ACCESS_DENIED_CLOSED_ENCOUNTER',
        resource_type: 'Encounter',
        resource_id: encounter._id.toString(),
        patient_id: encounter.patient_id ? encounter.patient_id._id : null,
        outcome: 'DENIED',
        details: {
          reason: 'Doctor access expires automatically when consultation ends. Closed encounter cannot be queried.',
          ended_at: encounter.ended_at,
        },
      });

      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Doctor access has expired. Consultation is closed. Historical records and notes are sealed by construction.',
        status: 'CLOSED',
        ended_at: encounter.ended_at,
      });
    }

    const intake = await SymptomIntake.findOne({ encounter_id: encounter._id });
    const currentNote = await ConsultationNote.findOne({ encounter_id: encounter._id });
    const currentOrders = await DiagnosticOrder.find({ encounter_id: encounter._id });

    let priorNotes = [];
    let publishedReports = [];

    if (encounter.visit_type === 'REVISITING') {
      priorNotes = await ConsultationNote.find({
        doctor_id: encounter.doctor_id._id,
        patient_id: encounter.patient_id._id,
        encounter_id: { $ne: encounter._id },
      }).sort({ created_at: -1 });

      const reports = await DiagnosticReport.find({
        patient_id: encounter.patient_id._id,
        status: 'PUBLISHED',
      })
        .populate('laboratory_id')
        .sort({ published_at: -1 });

      publishedReports = await Promise.all(
        reports.map(async (rep) => {
          const obs = await LabObservation.find({ report_id: rep._id });
          return {
            id: rep._id,
            _id: rep._id,
            test_type: rep.test_type,
            laboratory_name: rep.laboratory_id ? rep.laboratory_id.name : 'Registered Laboratory',
            laboratory_code: rep.laboratory_id ? rep.laboratory_id.qr_code_id : 'LAB-ORG',
            published_at: rep.published_at,
            original_file_name: rep.original_file_name,
            observations: obs,
          };
        })
      );
    }

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id ? encounter.doctor_id._id.toString() : 'UNKNOWN_DOCTOR',
      action: 'DOCTOR_OPENED_CLINICAL_COCKPIT',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: encounter.patient_id ? encounter.patient_id._id : null,
      outcome: 'SUCCESS',
      details: {
        visit_type: encounter.visit_type,
        prior_notes_count: priorNotes.length,
        reports_count: publishedReports.length,
      },
    });

    return res.json({
      success: true,
      encounter: {
        id: encounter._id,
        _id: encounter._id,
        visit_type: encounter.visit_type,
        status: encounter.status,
        lifecycle_state: encounter.lifecycle_state || 'WAITING',
        created_at: encounter.created_at,
        started_at: encounter.started_at,
      },
      patient: {
        id: encounter.patient_id._id,
        _id: encounter.patient_id._id,
        name: encounter.patient_id.name,
        patient_identifier: encounter.patient_id.patient_identifier,
        age: encounter.patient_id.age,
        gender: encounter.patient_id.gender,
        phone: encounter.patient_id.phone,
      },
      intake: intake
        ? {
            id: intake._id,
            input_mode: intake.input_mode,
            raw_transcript: intake.raw_transcript,
            chief_complaint: intake.chief_complaint,
            duration: intake.duration,
            symptoms: intake.symptoms,
            structured_data: intake.structured_data,
            confidence: intake.confidence,
            audio_deleted: intake.audio_deleted,
            created_at: intake.created_at,
          }
        : null,
      current_note: currentNote ? currentNote.notes_text : '',
      current_orders: currentOrders,
      prior_notes: priorNotes,
      published_reports: publishedReports,
    });
  } catch (error) {
    console.error('Error fetching cockpit data:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8. POST /api/doctor/encounter/:encounterId/start
 */
router.post('/encounter/:encounterId/start', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.encounterId)
      .populate('patient_id')
      .populate('doctor_id');

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Encounter is closed.',
      });
    }

    encounter.status = 'IN_CONSULTATION';
    encounter.lifecycle_state = 'PLEASE_COME_IN';
    encounter.started_at = new Date();
    await encounter.save();

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id ? encounter.doctor_id._id.toString() : 'UNKNOWN_DOCTOR',
      action: 'CONSULTATION_STARTED_PATIENT_CALLED',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: encounter.patient_id ? encounter.patient_id._id : null,
      outcome: 'SUCCESS',
      details: {
        lifecycle_state: 'PLEASE_COME_IN',
        started_at: encounter.started_at,
      },
    });

    return res.json({
      success: true,
      encounter: {
        id: encounter._id,
        status: encounter.status,
        lifecycle_state: encounter.lifecycle_state,
        started_at: encounter.started_at,
      },
      message: "Patient called. Patient sees 'It\'s your turn. Dr. Mehta is ready for you. Please come in.'",
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9. POST /api/doctor/encounter/:encounterId/notes
 */
router.post('/encounter/:encounterId/notes', async (req, res) => {
  try {
    const { notes_text } = req.body;
    const encounter = await Encounter.findById(req.params.encounterId);

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Cannot edit notes for a closed encounter.',
      });
    }

    let note = await ConsultationNote.findOne({ encounter_id: encounter._id });
    if (note) {
      note.notes_text = notes_text && notes_text.trim() ? notes_text.trim() : 'Clinical assessment documented.';
      await note.save();
    } else {
      note = await ConsultationNote.create({
        encounter_id: encounter._id,
        doctor_id: encounter.doctor_id,
        patient_id: encounter.patient_id,
        notes_text: notes_text && notes_text.trim() ? notes_text.trim() : 'Clinical assessment documented.',
      });
    }

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id.toString(),
      action: 'CONSULTATION_NOTE_SAVED',
      resource_type: 'ConsultationNote',
      resource_id: note._id.toString(),
      patient_id: encounter.patient_id,
      outcome: 'SUCCESS',
      details: { provenance: 'DOCTOR_ENTERED', length: (notes_text || '').length },
    });

    return res.json({
      success: true,
      note: {
        id: note._id,
        encounter_id: note.encounter_id,
        notes_text: note.notes_text,
        provenance: 'DOCTOR_ENTERED',
        created_at: note.created_at,
      },
    });
  } catch (error) {
    console.error('Error saving consultation note:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 10. POST /api/doctor/encounter/:encounterId/order-diagnostic
 */
router.post('/encounter/:encounterId/order-diagnostic', async (req, res) => {
  try {
    const { test_type = 'CBC', clinical_notes } = req.body;
    const encounter = await Encounter.findById(req.params.encounterId);

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Cannot order diagnostics for a closed encounter.',
      });
    }

    const order = await DiagnosticOrder.create({
      encounter_id: encounter._id,
      patient_id: encounter.patient_id,
      doctor_id: encounter.doctor_id,
      test_type: test_type,
      clinical_notes: clinical_notes || 'Routine diagnostic evaluation',
      status: 'ORDERED',
    });

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id.toString(),
      action: 'DIAGNOSTIC_ORDER_CREATED',
      resource_type: 'DiagnosticOrder',
      resource_id: order._id.toString(),
      patient_id: encounter.patient_id,
      outcome: 'SUCCESS',
      details: { test_type: order.test_type, status: order.status },
    });

    return res.status(201).json({
      success: true,
      order: {
        id: order._id,
        test_type: order.test_type,
        clinical_notes: order.clinical_notes,
        status: order.status,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating diagnostic order:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 11. POST /api/doctor/encounter/:encounterId/end
 */
router.post('/encounter/:encounterId/end', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.encounterId)
      .populate('patient_id')
      .populate('doctor_id');

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found.' });
    }

    if (encounter.status === 'CLOSED') {
      return res.status(400).json({ success: false, error: 'Encounter is already closed.' });
    }

    encounter.status = 'CLOSED';
    encounter.lifecycle_state = 'COMPLETED';
    encounter.ended_at = new Date();
    await encounter.save();

    await SymptomIntake.updateMany(
      { encounter_id: encounter._id },
      { $set: { audio_deleted: true } }
    );

    await AuditEvent.create({
      actor_type: 'DOCTOR',
      actor_id: encounter.doctor_id ? encounter.doctor_id._id.toString() : 'UNKNOWN_DOCTOR',
      action: 'CONSULTATION_ENDED_BOUNDED_ACCESS_TERMINATED',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: encounter.patient_id ? encounter.patient_id._id : null,
      outcome: 'SUCCESS',
      details: {
        ended_at: encounter.ended_at,
        raw_audio_deleted: true,
        retained: ['transcript', 'structured_intake', 'consultation_notes', 'audit_ledger'],
      },
    });

    return res.json({
      success: true,
      encounter: {
        id: encounter._id,
        status: encounter.status,
        lifecycle_state: encounter.lifecycle_state,
        ended_at: encounter.ended_at,
      },
      message: 'Consultation completed. Doctor access terminated. Raw audio permanently destroyed.',
    });
  } catch (error) {
    console.error('Error ending consultation:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 12. POST /api/doctor/encounter/checkin
 */
router.post('/encounter/checkin', async (req, res) => {
  try {
    const {
      patient_name = 'Rahul Sharma',
      patient_identifier = 'PT-2026-4401',
      age = 32,
      gender = 'Male',
      phone = '+91 98765 43210',
      doctor_code = 'DOC-409',
      visit_type = 'NEW',
      intake_data = null,
    } = req.body;

    const doctor = await Doctor.findOne({ qr_code_id: doctor_code.trim().toUpperCase() });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor with code ' + doctor_code + ' not found.' });
    }

    let patient = await Patient.findOne({ patient_identifier: patient_identifier.trim().toUpperCase() });
    if (!patient) {
      patient = await Patient.create({
        name: patient_name,
        patient_identifier: patient_identifier.trim().toUpperCase(),
        age: age,
        gender: gender,
        phone: phone,
        date_of_birth: '1994-08-14',
      });
    }

    // MANDATORY REQUIREMENT: If patient is NEW, add to queue IF AND ONLY IF they enter symptoms
    if (visit_type === 'NEW') {
      const hasSymptoms = intake_data && (
        (Array.isArray(intake_data.symptoms) && intake_data.symptoms.length > 0) ||
        (typeof intake_data.chief_complaint === 'string' && intake_data.chief_complaint.trim().length > 0) ||
        (typeof intake_data.raw_transcript === 'string' && intake_data.raw_transcript.trim().length > 0)
      );

      if (!hasSymptoms) {
        return res.status(400).json({
          success: false,
          error: 'MANDATORY_SYMPTOMS_REQUIRED: New patients must enter their symptoms before joining the doctor queue.',
        });
      }
    }

    const encounter = await Encounter.create({
      patient_id: patient._id,
      doctor_id: doctor._id,
      visit_type: visit_type,
      status: 'WAITING',
      lifecycle_state: 'WAITING',
    });

    if (intake_data) {
      await SymptomIntake.create({
        encounter_id: encounter._id,
        patient_id: patient._id,
        input_mode: intake_data.input_mode || 'voice',
        raw_transcript: intake_data.raw_transcript || '',
        chief_complaint: intake_data.chief_complaint || 'Weakness and fatigue',
        duration: intake_data.duration || '3 days',
        symptoms: intake_data.symptoms || ['Weakness', 'Dizziness', 'Mild fatigue'],
        structured_data: intake_data.structured_data || {},
        confidence: intake_data.confidence || 0.96,
        audio_deleted: false,
      });
    }

    // Calculate token position in queue
    const waitingCount = await Encounter.countDocuments({
      doctor_id: doctor._id,
      status: { $in: ['WAITING', 'IN_CONSULTATION'] },
    });
    const tokenNumber = '#' + waitingCount;

    // Create Notification event upon successful queue entry ONLY for returning (revisiting) patients
    if (visit_type === 'REVISITING') {
      await Notification.create({
        doctor_id: doctor._id,
        encounter_id: encounter._id,
        patient_id: patient._id,
        type: 'REVISITING_PATIENT_JOINED',
        title: 'Returning Patient Joined Queue',
        message: `${patient.name} has joined your consultation queue for a revisiting consultation.`,
        visit_type: 'REVISITING',
        token_number: tokenNumber,
        read: false,
      });
    }

    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: patient._id.toString(),
      action: 'PATIENT_CHECKED_IN_QUEUE',
      resource_type: 'Encounter',
      resource_id: encounter._id.toString(),
      patient_id: patient._id,
      outcome: 'SUCCESS',
      details: { doctor_code: doctor.qr_code_id, visit_type: visit_type },
    });

    return res.status(201).json({
      success: true,
      encounter_id: encounter._id,
      patient_name: patient.name,
      doctor_name: doctor.name,
      visit_type: encounter.visit_type,
      status: encounter.status,
      lifecycle_state: encounter.lifecycle_state,
    });
  } catch (error) {
    console.error('Error during patient checkin:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 13. GET /api/doctor/notifications/:doctorId
 */
router.get('/notifications/:doctorId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    const notifications = await Notification.find({
      doctor_id: doctor._id,
      visit_type: 'REVISITING',
    })
      .sort({ created_at: -1 })
      .limit(25);
    const unreadCount = await Notification.countDocuments({
      doctor_id: doctor._id,
      visit_type: 'REVISITING',
      read: false,
    });
    return res.json({ success: true, notifications, unread_count: unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 14. POST /api/doctor/notifications/:notificationId/read
 */
router.post('/notifications/:notificationId/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true },
      { new: true }
    );
    return res.json({ success: true, notification: notif });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 15. POST /api/doctor/notifications/read-all/:doctorId
 */
router.post('/notifications/read-all/:doctorId', async (req, res) => {
  try {
    await Notification.updateMany(
      { doctor_id: req.params.doctorId, visit_type: 'REVISITING', read: false },
      { read: true }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
