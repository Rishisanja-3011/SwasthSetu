const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null,
  },
  encounter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    default: null,
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  type: {
    type: String,
    enum: ['REVISITING_PATIENT_JOINED', 'NEW_PATIENT_JOINED', 'DIAGNOSTIC_ORDER_CREATED', 'REPORT_PUBLISHED'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  visit_type: {
    type: String,
    enum: ['NEW', 'REVISITING'],
    default: null,
  },
  token_number: {
    type: String,
    default: '#1',
  },
  diagnostic_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticOrder',
    default: null,
  },
  report_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticReport',
    default: null,
  },
  lab_access_grant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabAccessGrant',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ patient_id: 1, type: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
