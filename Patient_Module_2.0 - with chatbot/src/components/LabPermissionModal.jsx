import React, { useState } from 'react';
import { ShieldCheck, Check, X, AlertTriangle, Building2, User, Phone, Calendar, HeartPulse } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';

export function LabPermissionModal({ labEntity, isOpen, onClose, onSuccess }) {
  const { patient } = usePatient();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !labEntity) return null;

  const handleGrant = async () => {
    setLoading(true);
    try {
      const grant = await patientApi.approveLabGrant({
        patient,
        laboratory: labEntity,
      });
      onSuccess(grant);
      onClose();
    } catch (err) {
      alert('Failed to grant laboratory access: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {/* Lab Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'var(--teal-50)',
            border: '1px solid var(--teal-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--teal-700)',
            flexShrink: 0,
          }}>
            <Building2 size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="status-pill active" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                Accredited Lab
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--slate-500)' }}>
                {labEntity.qr_code_id}
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', marginTop: 2 }}>{labEntity.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{labEntity.location}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Permission Information Notice */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--slate-700)', fontWeight: 600, marginBottom: 12 }}>
            This laboratory needs the following 4 identity fields to prepare your diagnostic report:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem' }}>
              <Check size={16} color="var(--teal-600)" />
              <span style={{ color: 'var(--slate-600)' }}>Full Name:</span>
              <strong style={{ color: 'var(--navy-900)' }}>{patient.name}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem' }}>
              <Check size={16} color="var(--teal-600)" />
              <span style={{ color: 'var(--slate-600)' }}>Age / DOB:</span>
              <strong style={{ color: 'var(--navy-900)' }}>{patient.age} yrs ({patient.date_of_birth})</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem' }}>
              <Check size={16} color="var(--teal-600)" />
              <span style={{ color: 'var(--slate-600)' }}>Gender:</span>
              <strong style={{ color: 'var(--navy-900)' }}>{patient.gender}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem' }}>
              <Check size={16} color="var(--teal-600)" />
              <span style={{ color: 'var(--slate-600)' }}>Phone Number:</span>
              <strong style={{ color: 'var(--navy-900)' }}>{patient.phone}</strong>
            </div>
          </div>
        </div>

        {/* Bounded Access Guarantee Notice */}
        <div style={{
          backgroundColor: 'var(--teal-50)',
          border: '1px solid var(--teal-200)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
        }}>
          <ShieldCheck size={20} color="var(--teal-700)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--teal-900)', lineHeight: 1.45 }}>
            <strong>Bounded Access Policy:</strong> No consultation notes or prior medical records are shared. 
            Laboratory access <strong>expires automatically and immediately</strong> when the diagnostic report is published.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGrant}
            disabled={loading}
            style={{ flex: 2 }}
          >
            {loading ? 'Authorizing...' : 'Allow Limited Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
