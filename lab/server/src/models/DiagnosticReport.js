const mongoose = require('mongoose');

const diagnosticReportSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  laboratory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true,
  },
  diagnostic_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticOrder',
    default: null,
  },
  test_type: {
    type: String,
    default: 'CBC',
  },
  status: {
    type: String,
    enum: ['UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'PUBLISHED'],
    default: 'PROCESSING',
    index: true,
  },
  original_file_name: {
    type: String,
    default: 'CBC_Report_Generated.pdf',
  },
  report_source_type: {
    type: String,
    default: 'LAB_GENERATED_DIGITAL',
  },
  raw_text_content: {
    type: String,
    default: '',
  },
  report_hash: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  published_at: {
    type: Date,
    default: null,
  },
});

diagnosticReportSchema.index({ patient_id: 1, status: 1, published_at: -1 });
diagnosticReportSchema.index({ laboratory_id: 1, status: 1, created_at: -1 });
diagnosticReportSchema.index({ report_hash: 1 });

module.exports = mongoose.model('DiagnosticReport', diagnosticReportSchema);
