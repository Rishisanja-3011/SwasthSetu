const LabAccessGrant = require('../models/LabAccessGrant');
const Encounter = require('../models/Encounter');
const AuditEvent = require('../models/AuditEvent');

/**
 * Middleware: Enforces that laboratory has an ACTIVE, non-expired LabAccessGrant.
 * If expired or invalid, rejects request immediately with 403 Forbidden.
 */
async function enforceActiveLabGrant(req, res, next) {
  try {
    const grantId = req.params.grantId || req.body.grant_id || req.query.grant_id;

    if (!grantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing grant_id for bounded access validation.',
      });
    }

    const grant = await LabAccessGrant.findById(grantId)
      .populate('patient_id')
      .populate('laboratory_id')
      .populate('diagnostic_order_id');

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: 'LabAccessGrant not found.',
      });
    }

    // Check expiry by status and timestamp
    const now = new Date();
    const isTimestampExpired = now > new Date(grant.expires_at);

    if (grant.status === 'EXPIRED' || isTimestampExpired) {
      // If timestamp expired but status wasn't updated yet, persist expiration
      if (grant.status !== 'EXPIRED') {
        grant.status = 'EXPIRED';
        await grant.save();
      }

      // Log access denial to Audit Trail
      await AuditEvent.create({
        actor_type: 'LABORATORY',
        actor_id: grant.laboratory_id ? grant.laboratory_id._id.toString() : 'UNKNOWN_LAB',
        action: 'ACCESS_ATTEMPT_DENIED',
        resource_type: 'LabAccessGrant',
        resource_id: grant._id.toString(),
        patient_id: grant.patient_id ? grant.patient_id._id : null,
        outcome: 'EXPIRED',
        details: {
          reason: 'Lab access has expired automatically by construction (Bounded Access Model).',
          expired_at: grant.expires_at,
        },
      });

      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Laboratory access has expired. Under VaaniDoc bounded access, lab access ends once the report is published or 48h elapses.',
        grant_status: 'EXPIRED',
        expires_at: grant.expires_at,
      });
    }

    // Attach valid grant to request
    req.labGrant = grant;
    next();
  } catch (error) {
    console.error('Error in enforceActiveLabGrant middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error in bounded access verification.',
    });
  }
}

/**
 * Middleware: Enforces Doctor Access Bounded Model.
 * Doctor access exists ONLY while the consultation encounter is OPEN (WAITING or IN_CONSULTATION).
 * When status is CLOSED, access expires automatically and cannot be queried.
 */
async function enforceDoctorEncounterAccess(req, res, next) {
  try {
    const encounterId = req.params.encounterId || req.body.encounter_id || req.query.encounter_id;

    if (!encounterId) {
      return res.status(400).json({
        success: false,
        error: 'Missing encounter_id for bounded access validation.',
      });
    }

    const encounter = await Encounter.findById(encounterId)
      .populate('patient_id')
      .populate('doctor_id');

    if (!encounter) {
      return res.status(404).json({
        success: false,
        error: 'Encounter not found.',
      });
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
          reason: 'Doctor access expires automatically when consultation ends (Bounded Access Model). Closed encounters cannot be queried.',
          ended_at: encounter.ended_at,
        },
      });

      return res.status(403).json({
        success: false,
        error: 'BOUNDED_ACCESS_EXPIRED: Doctor access has expired. Consultation is closed. Historical records and notes are sealed by construction.',
        encounter_status: 'CLOSED',
        ended_at: encounter.ended_at,
      });
    }

    req.encounter = encounter;
    next();
  } catch (error) {
    console.error('Error in enforceDoctorEncounterAccess middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error in doctor bounded access verification.',
    });
  }
}

module.exports = {
  enforceActiveLabGrant,
  enforceDoctorEncounterAccess,
};
