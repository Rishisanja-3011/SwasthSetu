require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const labRoutes = require('./routes/labRoutes');
const seedRoutes = require('./routes/seedRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const Laboratory = require('./models/Laboratory');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const DiagnosticOrder = require('./models/DiagnosticOrder');
const LabAccessGrant = require('./models/LabAccessGrant');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/lab', labRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/doctor', doctorRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'VaaniDoc 2.0 - Lab Module API & Bounded Access Guard',
    timestamp: new Date(),
  });
});

// Auto-seed if database is empty
async function autoSeedIfEmpty() {
  try {
    const labCount = await Laboratory.countDocuments();
    if (labCount === 0) {
      console.log('[VaaniDoc 2.0] Empty database detected. Seeding initial demo data...');
      
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

      const lab = await Laboratory.create({
        name: 'Lifeline Diagnostic Centre',
        qr_code_id: 'LAB-808',
        platform_approval_status: 'APPROVED',
        location: 'Primary Health Care Center - Lab Wing B',
        contact_phone: '+91 98200 11223',
      });

      const cbcOrder = await DiagnosticOrder.create({
        patient_id: rahul._id,
        doctor_id: doctor._id,
        test_type: 'CBC',
        clinical_notes: 'Evaluate mild fatigue and recurring evening fever. Check Hemoglobin, TLC, and Platelets.',
        status: 'ORDERED',
      });

      await LabAccessGrant.create({
        patient_id: rahul._id,
        laboratory_id: lab._id,
        diagnostic_order_id: cbcOrder._id,
        status: 'ACTIVE',
        granted_at: new Date(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      console.log('[VaaniDoc 2.0] Initial demo data seeded successfully!');
    }
  } catch (err) {
    console.error('[VaaniDoc 2.0] Auto-seeding error:', err.message);
  }
}

// Start Server
async function startServer() {
  await connectDB();
  await autoSeedIfEmpty();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  VaaniDoc 2.0 Lab Module Server running on port ${PORT}`);
    console.log(`  API Base: http://localhost:${PORT}/api/lab`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
