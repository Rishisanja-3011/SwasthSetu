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
    enum: ['voice', 'text', 'skipped'],
    default: 'voice',
  },
  raw_transcript: {
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
