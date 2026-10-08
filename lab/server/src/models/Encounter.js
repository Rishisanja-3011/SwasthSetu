const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  visit_type: {
    type: String,
    enum: ['NEW', 'REVISITING'],
    required: true,
  },
  status: {
    type: String,
    enum: ['WAITING', 'IN_CONSULTATION', 'CLOSED'],
    default: 'WAITING',
  },
  lifecycle_state: {
    type: String,
    enum: ['WAITING', 'DOCTOR_REVIEWING', 'PLEASE_COME_IN', 'COMPLETED', 'CONSULTATION_COMPLETED'],
    default: 'WAITING',
  },
  queue_number: {
    type: Number,
    default: 1,
  },
  started_at: {
    type: Date,
    default: null,
  },
  ended_at: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Encounter', encounterSchema);
