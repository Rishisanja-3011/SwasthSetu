import React, { useState } from 'react';
import { FlaskConical, X, Check, AlertCircle } from 'lucide-react';
import { doctorApi } from '../services/doctorApi';

export const DiagnosticOrderModal = ({ encounterId, isOpen, onClose, onOrderCreated }) => {
  const [testType, setTestType] = useState('CBC');
  const [clinicalNotes, setClinicalNotes] = useState('Evaluate mild fatigue and recurring weakness. Check Hemoglobin, TLC, and Platelets.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 19, 41, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div className="v-card fade-in" style={{
        maxWidth: 500,
        width: '100%',
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                Create Diagnostic Order
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                Order lab investigation for this consultation encounter
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
              Test Capability / Panel
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-medium)',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff',
                color: 'var(--navy-900)',
                fontWeight: 600,
              }}
            >
              <option value="CBC">Complete Blood Count (CBC) - Standard Hematology</option>
              <option value="Hemoglobin (HPLC)">Hemoglobin (HPLC) / Thalassemia Screen</option>
              <option value="Platelet Count">Platelet Count - Focused Count</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
              Clinical Notes & Indications
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-medium)',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                color: 'var(--navy-900)',
                resize: 'vertical',
              }}
              placeholder="Specify symptoms or test indications..."
            />
          </div>

          <div style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            marginBottom: 20,
            fontSize: '0.76rem',
            color: 'var(--slate-600)',
          }}>
            <strong>Diagnostic Workflow:</strong> Once ordered, the patient presents to any registered laboratory (e.g. Lifeline Diagnostics LAB-808) and approves demographic sharing. The lab's published findings will connect back to VaaniDoc.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-teal"
              disabled={submitting}
            >
              {submitting ? 'Creating Order...' : 'Create Diagnostic Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
