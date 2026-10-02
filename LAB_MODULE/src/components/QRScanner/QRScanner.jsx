import React, { useState } from 'react';
import { QrCode, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../Button/Button';
import './QRScanner.css';

export function QRScanner({ patientId, onVerified, onCancel }) {
  const [method, setMethod] = useState('otp'); // 'otp' | 'qr'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!code.trim()) {
      setError('Please enter a verification code or scan a QR payload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onVerified(method, code.trim());
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateQRScan = (sampleCode = 'TOKEN-PX-VISIT-2026') => {
    setCode(sampleCode);
  };

  return (
    <div className="qr-scanner-widget">
      <div className="scanner-tabs">
        <button
          type="button"
          className={`scanner-tab-btn ${method === 'otp' ? 'active' : ''}`}
          onClick={() => { setMethod('otp'); setError(null); }}
        >
          <KeyRound size={16} />
          <span>Patient Check-in OTP</span>
        </button>
        <button
          type="button"
          className={`scanner-tab-btn ${method === 'qr' ? 'active' : ''}`}
          onClick={() => { setMethod('qr'); setError(null); }}
        >
          <QrCode size={16} />
          <span>Scan Patient QR Token</span>
        </button>
      </div>

      <div className="scanner-body">
        {method === 'otp' ? (
          <div className="otp-pane">
            <p className="scanner-instr">
              Ask the patient to provide the 6-digit visit verification passcode displayed on their platform mobile screen for <strong>{patientId}</strong>.
            </p>
            <div className="otp-input-group">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="otp-field mono"
                autoFocus
              />
            </div>
            <div className="quick-test-badges">
              <span className="test-lbl">Test scenarios:</span>
              <button
                type="button"
                className="quick-fill-btn success"
                onClick={() => setCode('123456')}
              >
                123456 (Approve)
              </button>
              <button
                type="button"
                className="quick-fill-btn danger"
                onClick={() => setCode('000000')}
              >
                000000 (Deny)
              </button>
              <button
                type="button"
                className="quick-fill-btn warn"
                onClick={() => setCode('999999')}
              >
                999999 (Expired)
              </button>
            </div>
          </div>
        ) : (
          <div className="qr-pane">
            <div className="qr-viewport">
              <div className="qr-laser-line" />
              <div className="qr-corners" />
              <QrCode size={100} className="qr-preview-icon" />
              <p className="qr-view-caption">Position patient's check-in QR inside camera frame</p>
            </div>
            <div className="quick-test-badges">
              <button
                type="button"
                className="quick-fill-btn success"
                onClick={() => handleSimulateQRScan('PX-VISIT-AUTH-VALID-883')}
              >
                <Sparkles size={13} />
                Simulate Successful QR Check-in Scan
              </button>
            </div>
            {code && (
              <div className="scanned-token-box">
                <span className="token-lbl">Scanned Token:</span>
                <span className="mono">{code}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="scanner-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="scanner-action-footer">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon={<CheckCircle2 size={16} />}
          >
            Authorize Lab Visit Consent
          </Button>
        </div>
      </div>
    </div>
  );
}
