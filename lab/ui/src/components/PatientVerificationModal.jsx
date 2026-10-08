import React from 'react';
import { UserCheck, ShieldCheck, AlertCircle, ArrowRight, X } from 'lucide-react';

export default function PatientVerificationModal({
  isOpen,
  onClose,
  identityData,
  onProceedToExtraction,
}) {
  if (!isOpen || !identityData) return null;

  const { identity, order, grant_status, expires_at } = identityData;

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
        }}
      >
        {/* Fixed Header */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <UserCheck size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Patient Visit Verification</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lab Screen #12 — Identity-Field Check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.35rem' }}>
          {/* Bounded Access Guard Notice */}
          <div className="banner info" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Rule B Enforced:</strong> Exactly four identity fields (Name, Age/DOB, Gender, Phone) 
              are exposed by patient approval. Consultation notes and doctor's private records are strictly inaccessible.
            </div>
          </div>

          {/* 4 Identity Fields Exposed */}
          <div className="identity-grid">
            <div className="identity-field">
              <div className="label">Full Name</div>
              <div className="value">{identity?.name}</div>
            </div>
            <div className="identity-field">
              <div className="label">Age / Date of Birth</div>
              <div className="value">{identity?.age} yrs ({identity?.date_of_birth})</div>
            </div>
            <div className="identity-field">
              <div className="label">Gender</div>
              <div className="value">{identity?.gender}</div>
            </div>
            <div className="identity-field">
              <div className="label">Phone Number</div>
              <div className="value" style={{ fontFamily: 'var(--font-mono)' }}>{identity?.phone}</div>
            </div>
          </div>

          {/* Diagnostic Order Details */}
          {order && (
            <div style={{ marginTop: '1.25rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                  Doctor's Diagnostic Order
                </span>
                <span className="badge badge-low">{order.test_type}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{order.clinical_notes}</p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button className="btn btn-outline" onClick={onClose}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={onProceedToExtraction}
          >
            <span>Confirm Identity & Run CBC</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
