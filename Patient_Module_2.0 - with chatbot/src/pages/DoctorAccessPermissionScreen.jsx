import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowLeft,
  Stethoscope,
  Lock,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export function DoctorAccessPermissionScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient } = usePatient();

  const doctor = location.state?.doctor;

  if (!doctor) {
    navigate('/');
    return null;
  }

  const handleAllowAccess = () => {
    // Navigate to Intake with REVISITING visitType and explicit doctorAccessGranted
    navigate('/intake', {
      state: {
        doctor,
        visitType: 'REVISITING',
        doctorAccessGranted: true,
      },
    });
  };

  const handleCancel = () => {
    navigate('/visit-type', { state: { doctor } });
  };

  return (
    <div className="fade-in page-centered-container" style={{ maxWidth: 660, padding: '8px 0' }}>
      <button
        onClick={handleCancel}
        className="btn btn-secondary"
        style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--blue-700)',
          backgroundColor: 'var(--blue-50)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid var(--blue-200)',
          display: 'inline-block',
          marginBottom: 8,
        }}>
          Revisiting Consultation • Bounded Record Access
        </span>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: 6 }}>
          Allow {doctor.name} to access your previous records?
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)' }}>
          To assist with your follow-up checkup, this doctor needs temporary bounded access to your relevant medical history.
        </p>
      </div>

      {/* Allowed Records Information Card (Section 3 & 6) */}
      <div className="v-card" style={{
        padding: 20,
        border: '2px solid var(--blue-200)',
        boxShadow: '0 4px 16px rgba(29, 78, 216, 0.08)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'var(--blue-50)',
            color: 'var(--blue-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--navy-900)' }}>{doctor.name}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>
              {doctor.specialty} • {doctor.clinic_name}
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 14,
          marginBottom: 14,
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: 10 }}>
            Permitted Records (Revisiting Consultation):
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={18} color="var(--teal-600)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--navy-900)', display: 'block' }}>
                  Previous consultation notes written by {doctor.name}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                  Prior clinical observations, prescriptions, and notes authored by this same physician.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={18} color="var(--teal-600)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--navy-900)', display: 'block' }}>
                  Previously published diagnostic / blood reports
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                  All published CBC laboratory reports belonging to you, regardless of laboratory.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bounded Access Invariant Notice */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          gap: 10,
        }}>
          <ShieldCheck size={20} color="var(--blue-700)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.8rem', color: '#1e3a8a', lineHeight: 1.45 }}>
            <strong>Bounded Access Policy:</strong> Access to these records is available strictly while this consultation is <strong>OPEN</strong> and <strong>ends automatically when the consultation ends</strong>.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={handleAllowAccess}
        >
          <CheckCircle2 size={20} />
          Allow Access & Continue
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--slate-500)', marginTop: 14 }}>
        Your health record is owned by you. Provider access automatically expires with zero standing permissions.
      </p>
    </div>
  );
}
