const mongoose = require('mongoose');

const labAccessGrantSchema = new mongoose.Schema({
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
  granted_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED'],
    default: 'ACTIVE',
  },
  expires_at: {
    type: Date,
    required: true,
    // By default 48 hours from creation unless terminated upon publish
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
  },
  published_report_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticReport',
    default: null,
  },
});

// Helper method to check if grant is actively valid
labAccessGrantSchema.methods.isValid = function () {
  return this.status === 'ACTIVE' && new Date() < new Date(this.expires_at);
};

module.exports = mongoose.model('LabAccessGrant', labAccessGrantSchema);
