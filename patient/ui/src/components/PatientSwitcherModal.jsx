import React from 'react';
import { X, LogOut, ShieldCheck } from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export function PatientSwitcherModal({ onClose }) {
  const { patient, logout } = usePatient();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Patient Identity Profile</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
              Master Universal Record: Central Patient Identifier
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Patient Card */}
        <div style={{
          background: 'linear-gradient(135deg, #e6f7f4 0%, #eff6ff 100%)',
          border: '1px solid var(--teal-200)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--teal-800)',
              backgroundColor: '#ffffff',
              padding: '2px 8px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)'
            }}>
              UNIVERSAL ID: {patient.patient_identifier}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--teal-700)', fontWeight: 600 }}>Authenticated</span>
          </div>

          <h2 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', marginBottom: 4 }}>{patient.name}</h2>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.84rem', color: 'var(--slate-600)', marginTop: 8 }}>
            <span>Age: <strong>{patient.age} yrs</strong></span>
            <span>Gender: <strong>{patient.gender}</strong></span>
            <span>Phone: <strong>{patient.phone}</strong></span>
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--teal-50)', border: '1px solid var(--teal-200)', display: 'flex', gap: 9, color: 'var(--teal-900)', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: 16 }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          This record is tied to your verified mobile number. Patient identities cannot be switched from this portal.
        </div>

        <button className="btn btn-secondary btn-block" onClick={() => { logout(); onClose(); }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
