import React, { useState } from 'react';
import { QrCode, UserPlus, RefreshCw, X, ShieldCheck, Printer, Check } from 'lucide-react';

export default function LabQRModal({
  isOpen,
  onClose,
  lab,
  onSimulatePatient,
  isSimulating,
}) {
  const [selectedPreset, setSelectedPreset] = useState('ananya');

  if (!isOpen) return null;

  const presets = [
    {
      id: 'ananya',
      name: 'Ananya Iyer',
      age: 28,
      gender: 'Female',
      phone: '+91 97654 32109',
      notes: 'Routine pre-operative CBC evaluation before minor ENT surgery. Baseline check for Hb & platelets.',
    },
    {
      id: 'vikram',
      name: 'Vikram Sen',
      age: 49,
      gender: 'Male',
      phone: '+91 98450 11992',
      notes: 'Follow-up for persistent lethargy and paleness. Check for nutritional deficiency anemia.',
    },
  ];

  const handleSimulate = () => {
    const chosen = presets.find((p) => p.id === selectedPreset);
    if (chosen) {
      onSimulatePatient(chosen);
    }
  };

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
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <QrCode size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Laboratory QR Code & Walk-in Station</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Patient Intake & Bounded Identity Sharing Discovery</p>
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
          {/* QR Poster Simulation Card */}
          <div className="qr-poster">
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
              VaaniDoc 2.0 Registered Laboratory
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
              {lab?.name || 'Lifeline Diagnostic Centre'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Patients: Scan this QR code with your camera or VaaniDoc app to grant 4-field identity access.
            </p>

            <div className="qr-matrix-box">
              {/* SVG Visual Representation of QR */}
              <svg width="130" height="130" viewBox="0 0 100 100" fill="#0f172a">
                <rect width="100" height="100" fill="#f8fafc" />
                {/* Corner squares */}
                <rect x="10" y="10" width="25" height="25" fill="#0284c7" />
                <rect x="15" y="15" width="15" height="15" fill="#f8fafc" />
                <rect x="18" y="18" width="9" height="9" fill="#0284c7" />

                <rect x="65" y="10" width="25" height="25" fill="#0284c7" />
                <rect x="70" y="15" width="15" height="15" fill="#f8fafc" />
                <rect x="73" y="18" width="9" height="9" fill="#0284c7" />

                <rect x="10" y="65" width="25" height="25" fill="#0284c7" />
                <rect x="15" y="70" width="15" height="15" fill="#f8fafc" />
                <rect x="18" y="73" width="9" height="9" fill="#0284c7" />

                {/* Data modules */}
                <rect x="42" y="12" width="6" height="6" />
                <rect x="52" y="18" width="6" height="6" />
                <rect x="42" y="28" width="6" height="6" />
                <rect x="48" y="38" width="6" height="6" />
                <rect x="12" y="48" width="6" height="6" />
                <rect x="22" y="52" width="6" height="6" />
                <rect x="32" y="42" width="6" height="6" />
                <rect x="68" y="48" width="6" height="6" />
                <rect x="78" y="58" width="6" height="6" />
                <rect x="42" y="68" width="6" height="6" />
                <rect x="52" y="78" width="6" height="6" />
                <rect x="62" y="82" width="6" height="6" />
                <rect x="82" y="78" width="6" height="6" />
              </svg>

              <div style={{ marginTop: '0.75rem' }}>
                <span className="qr-code-pill">{lab?.qr_code_id || 'LAB-808'}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                Fallback Code: <strong>{lab?.qr_code_id || 'LAB-808'}</strong>
              </div>
            </div>
          </div>

          {/* Live Simulator for Walk-In Patient */}
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Simulate Walk-in Patient Scan
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.85rem' }}>
              Select a test patient to simulate the patient scanning this QR code and consenting to identity sharing:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {presets.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    style={{
                      background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: '#f8fafc', display: 'block' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {p.gender}, {p.age} yrs
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.2 }}>
                      {p.notes.slice(0, 50)}...
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
            Close
          </button>
          <button
            className="btn btn-primary"
            disabled={isSimulating}
            onClick={handleSimulate}
          >
            {isSimulating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Granting Access...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Simulate Scan & Grant Access</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
