const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Laboratory = require('../models/Laboratory');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const LabAccessGrant = require('../models/LabAccessGrant');
const DiagnosticReport = require('../models/DiagnosticReport');
const LabObservation = require('../models/LabObservation');
const AuditEvent = require('../models/AuditEvent');

/**
 * Seed or reset database for VaaniDoc 2.0 Lab Module demo
 */
router.post('/reset', async (req, res) => {
  try {
    // Clear previous demo test data
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Laboratory.deleteMany({}),
      DiagnosticOrder.deleteMany({}),
      LabAccessGrant.deleteMany({}),
      DiagnosticReport.deleteMany({}),
      LabObservation.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);

    // 1. Create Patient User & Profile (Rahul Sharma)
    const patientUser = await User.create({
      role: 'patient',
      phone: '+91 98765 43210',
      name: 'Rahul Sharma',
    });

    const rahul = await Patient.create({
      user_id: patientUser._id,
      name: 'Rahul Sharma',
      date_of_birth: '1994-08-14',
      age: 32,
      gender: 'Male',
      phone: '+91 98765 43210',
      patient_identifier: 'PT-2026-4401',
    });

    // 2. Create Doctor (Dr. Mehta)
    const doctorUser = await User.create({
      role: 'doctor',
      phone: '+91 98111 22334',
      name: 'Dr. Ramesh Mehta',
    });

    const doctor = await Doctor.create({
      user_id: doctorUser._id,
      name: 'Dr. Ramesh Mehta',
      specialty: 'General Physician',
      clinic_name: 'Mehta Community Health Clinic',
      qr_code_id: 'DOC-409',
    });

    // 3. Create Registered Laboratory (Lifeline Diagnostics)
    const lab = await Laboratory.create({
      name: 'Lifeline Diagnostic Centre',
      qr_code_id: 'LAB-808',
      platform_approval_status: 'APPROVED',
      location: 'Primary Health Care Center - Lab Wing B',
      contact_phone: '+91 98200 11223',
    });

    // 4. Create Doctor's CBC Diagnostic Order
    const cbcOrder = await DiagnosticOrder.create({
      patient_id: rahul._id,
      doctor_id: doctor._id,
      test_type: 'CBC',
      clinical_notes: 'Evaluate mild fatigue and recurring evening fever. Check Hemoglobin, TLC, and Platelets.',
      status: 'ORDERED',
    });

    // 5. Create Active LabAccessGrant (Patient scanned Lab QR LAB-808 and approved sharing of 4 fields)
    const grant = await LabAccessGrant.create({
      patient_id: rahul._id,
      laboratory_id: lab._id,
      diagnostic_order_id: cbcOrder._id,
      status: 'ACTIVE',
      granted_at: new Date(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h active grant
    });

    // Audit initial grant
    await AuditEvent.create({
      actor_type: 'PATIENT',
      actor_id: rahul._id.toString(),
      action: 'APPROVE_LAB_IDENTITY_SHARING',
      resource_type: 'LabAccessGrant',
      resource_id: grant._id.toString(),
      patient_id: rahul._id,
      outcome: 'SUCCESS',
      details: {
        laboratory_id: lab._id.toString(),
        lab_code: lab.qr_code_id,
        exposed_fields: ['name', 'date_of_birth', 'gender', 'phone'],
      },
    });

    res.json({
      success: true,
      message: 'Demo dataset successfully seeded for VaaniDoc 2.0 Lab Module.',
      data: {
        patient: rahul,
        doctor,
        laboratory: lab,
        diagnostic_order: cbcOrder,
        lab_access_grant: grant,
      },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Status check to ensure database is ready
 */
router.get('/status', async (req, res) => {
  try {
    const labCount = await Laboratory.countDocuments();
    const patientCount = await Patient.countDocuments();
    const grantCount = await LabAccessGrant.countDocuments();

    res.json({
      success: true,
      ready: labCount > 0,
      stats: { laboratories: labCount, patients: patientCount, grants: grantCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
