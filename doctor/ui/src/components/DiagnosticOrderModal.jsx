import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, X, AlertCircle } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';

export const DiagnosticOrderModal = ({ encounterId, isOpen, onClose, onOrderCreated }) => {
  const [testType, setTestType] = useState('CBC');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(false);
  closeRef.current = onClose;
  submittingRef.current = submitting;

  useEffect(() => {
    if (!isOpen) return undefined;
    setError(null);
    setClinicalNotes('');
    setTestType('CBC');
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape' && !submittingRef.current) closeRef.current();
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll('button:not(:disabled), select, textarea');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await doctorApi.orderDiagnostic(encounterId, {
        test_type: testType,
        clinical_notes: clinicalNotes,
      });
      if (onOrderCreated) onOrderCreated(order);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create diagnostic order');
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      style={{
       position: 'fixed',
       inset: 0,
       backgroundColor: 'rgba(5, 19, 41, 0.65)',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       zIndex: 2000,
       padding: 16,
       overflowY: 'auto',
       isolation: 'isolate',
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-order-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="v-card"
        style={{
         maxWidth: 500,
         width: '100%',
         maxHeight: 'calc(100vh - 32px)',
         overflowY: 'auto',
         backgroundColor: '#ffffff',
         padding: 24,
         borderRadius: 16,
         border: '1px solid var(--border-subtle)',
         boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--teal-50)',
              color: 'var(--teal-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 id="diagnostic-order-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Create Diagnostic Order
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                Order lab investigation for this consultation encounter
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close diagnostic order dialog"
            style={{ background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.84rem',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="diagnostic-test-type" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
              Test Capability / Panel
            </label>
            <select
              id="diagnostic-test-type"
              value={testType}
              onChange={(event) => setTestType(event.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: '#ffffff', color: 'var(--navy-900)', fontWeight: 600 }}
            >
              <option value="CBC">Complete Blood Count (CBC) - Standard Hematology</option>
              <option value="HEMOGLOBIN_HPLC">Hemoglobin (HPLC) / Thalassemia Screen</option>
              <option value="PLATELET_COUNT">Platelet Count - Focused Count</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="diagnostic-clinical-notes" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
              Clinical Notes &amp; Indications
            </label>
            <textarea
              id="diagnostic-clinical-notes"
              value={clinicalNotes}
              onChange={(event) => setClinicalNotes(event.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', fontSize: '0.88rem', fontFamily: 'inherit', color: 'var(--navy-900)', resize: 'vertical' }}
              placeholder="Specify symptoms or test indications..."
            />
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', marginBottom: 20, fontSize: '0.76rem', color: 'var(--slate-600)' }}>
            <strong>Diagnostic Workflow:</strong> The patient can take this order to any registered laboratory and approve the laboratory identity-sharing request.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-teal" disabled={submitting}>
              {submitting ? 'Creating Order...' : 'Create Diagnostic Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
