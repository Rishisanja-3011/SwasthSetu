const mongoose = require('mongoose');

const laboratorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  qr_code_id: {
    type: String,
    required: true,
    unique: true,
  },
  platform_approval_status: {
    type: String,
    enum: ['APPROVED', 'PENDING', 'REVOKED'],
    default: 'APPROVED',
  },
  location: {
    type: String,
    default: 'District Diagnostic Center',
  },
  contact_phone: {
    type: String,
    default: '+91 98200 11223',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Laboratory', laboratorySchema);
