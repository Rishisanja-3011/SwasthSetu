const mongoose = require('mongoose');

const symptomIntakeSchema = new mongoose.Schema({
  encounter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    required: true,
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  input_mode: {
    type: String,
    enum: ['VOICE', 'TEXT', 'SKIPPED'],
    required: true,
  },
  transcript: {
    type: String,
    default: '',
  },
  chief_complaint: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '',
  },
  symptoms: [{
    type: String,
  }],
  structured_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  confidence: {
    type: Number,
    default: 0.95,
    min: 0,
    max: 1,
  },
  provenance: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      transcript: 'PATIENT_REPORTED',
      structured_data: 'AI_GENERATED',
    },
  },
  confirmed_at: {
    type: Date,
    default: null,
  },
  audio_deleted: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SymptomIntake', symptomIntakeSchema);
