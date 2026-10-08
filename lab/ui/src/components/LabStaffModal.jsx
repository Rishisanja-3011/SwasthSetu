import React, { useState } from 'react';
import { UserCheck, Shield, Check, X, Award, Stethoscope, Building2 } from 'lucide-react';

export default function LabStaffModal({
  isOpen,
  onClose,
  staffList,
  activeStaff,
  onSelectStaff,
  activeLab,
}) {
  const [selectedId, setSelectedId] = useState(activeStaff?.id || 'staff-01');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const chosen = staffList.find((s) => s.id === selectedId);
    if (chosen) {
      onSelectStaff(chosen);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          maxWidth: '580px',
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
              <UserCheck size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Laboratory Authentication & Staff Switcher</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Lab Screen #1 — Role-Based Clinical Duty Roster</p>
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
          {/* Current Laboratory Info */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building2 size={18} color="#38bdf8" />
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
                  {activeLab?.name || 'Lifeline Diagnostic Centre'}
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  QR ID: {activeLab?.qr_code_id || 'LAB-808'} · Status: {activeLab?.platform_approval_status || 'APPROVED'}
                </div>
              </div>
            </div>
            <span className="badge badge-normal">Accredited LIS</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Select the active on-duty laboratory practitioner. All deterministic CBC reviews, edits, and final sign-offs will be attributed to this credential in the audit trail:
          </p>

          {/* Staff List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {staffList.map((staff) => {
              const isSelected = selectedId === staff.id;

              return (
                <div
                  key={staff.id}
                  onClick={() => setSelectedId(staff.id)}
                  style={{
                    background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isSelected
                          ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                          : 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#ffffff',
                      }}
                    >
                      {staff.avatar}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{staff.name}</strong>
                        {staff.canSignOff ? (
                          <span className="badge badge-ok" style={{ fontSize: '0.62rem' }}>
                            Sign-Off Authority
                          </span>
                        ) : (
                          <span className="badge badge-low" style={{ fontSize: '0.62rem' }}>
                            QA Reviewer
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.15rem' }}>
                        {staff.role} · {staff.qualification}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        License: {staff.license}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={14} color="#fff" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: '2px solid var(--border-medium)',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            <Shield size={16} />
            <span>Confirm & Switch Active Practitioner</span>
          </button>
        </div>
      </div>
    </div>
  );
}
