import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, QrCode, KeyRound, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { Button } from '../Button/Button';
import './ConsentCard.css';

export function ConsentCard({ consent, onVerifyClick, patientId }) {
  if (!consent || !consent.status) {
    return (
      <div className="consent-box missing">
        <div className="consent-icon-wrapper warning">
          <AlertTriangle size={22} />
        </div>
        <div className="consent-info">
          <div className="consent-header-line">
            <span className="consent-title">Visit Consent Required</span>
            <StatusBadge status="PENDING" />
          </div>
          <p className="consent-explanation">
            Per Handbook V1.1 (Section 10.2 & 12.31), laboratories cannot attach or upload reports without an approved patient visit consent token.
          </p>
        </div>
        {onVerifyClick && (
          <Button variant="primary" size="sm" onClick={onVerifyClick} icon={<KeyRound size={15} />}>
            Verify Patient Consent
          </Button>
        )}
      </div>
    );
  }

  const isApproved = consent.status === 'APPROVED';
  const isExpired = consent.status === 'EXPIRED';
  const isDenied = consent.status === 'DENIED';

  const formatExpiry = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={`consent-box ${isApproved ? 'approved' : isDenied ? 'denied' : 'expired'}`}>
      <div className={`consent-icon-wrapper ${isApproved ? 'success' : 'danger'}`}>
        {isApproved ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
      </div>
      <div className="consent-info">
        <div className="consent-header-line">
          <span className="consent-title">
            Visit Authorization: <span className="mono">{consent.id}</span>
          </span>
          <StatusBadge status={consent.status} />
        </div>
        <div className="consent-meta-grid">
          <div className="consent-meta-item">
            <span className="meta-lbl">Patient Platform ID:</span>
            <span className="meta-val mono">{consent.patient_id}</span>
          </div>
          <div className="consent-meta-item">
            <span className="meta-lbl">Verification Method:</span>
            <span className="meta-val">
              {consent.method === 'qr' ? 'Patient QR Check-in' : 'One-Time Passcode (OTP)'}
            </span>
          </div>
          <div className="consent-meta-item">
            <span className="meta-lbl">Authorized Window:</span>
            <span className="meta-val">Until {formatExpiry(consent.expires_at)}</span>
          </div>
        </div>
        {!isApproved && (
          <p className="consent-explanation error">
            {isExpired
              ? 'Visit authorization window has expired. A fresh check-in OTP or QR code must be presented by the patient.'
              : 'Visit consent was declined by the patient. Report upload remains locked.'}
          </p>
        )}
      </div>
      {(!isApproved && onVerifyClick) && (
        <Button variant="secondary" size="sm" onClick={onVerifyClick}>
          Re-verify Consent
        </Button>
      )}
    </div>
  );
}
