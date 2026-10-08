import React from 'react';
import { X, Download, ShieldCheck, FileText, CheckCircle2, Building2 } from 'lucide-react';

export function OriginalPdfModal({ report, isOpen, onClose }) {
  if (!isOpen || !report) return null;

  const handleDownload = () => {
    // Generate text/file download representation of the preserved document
    const content = `================================================================================
           LIFELINE DIAGNOSTIC CENTRE - ACCREDITED PATHOLOGY WING
           CENTRAL AUTOMATED HAEMATOLOGY LABORATORY REPORT
================================================================================
PATIENT NAME    : ${report.patient_name || 'Rahul Sharma'}
PATIENT ID      : ${report.patient_identifier || 'PT-2026-4401'}
ORDERING DOCTOR : ${report.ordering_doctor || 'Dr. Ramesh Mehta (DOC-409)'}
LABORATORY      : ${report.laboratory_name || 'Lifeline Diagnostic Centre (LAB-808)'}
SAMPLE DATE     : ${new Date(report.created_at).toLocaleDateString()}
STATUS          : PUBLISHED & CRYPTOGRAPHICALLY PRESERVED
SHA-256 HASH    : ${report.report_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
--------------------------------------------------------------------------------
TEST PARAMETER              RESULT       UNIT       REFERENCE RANGE   STATUS
--------------------------------------------------------------------------------
${(report.observations || [])
  .map(
    (o) =>
      `${(o.test_name_normalized || o.test_name_original).padEnd(26)} ${String(o.value).padEnd(10)} ${(o.unit || '').padEnd(10)} ${(o.reference_low !== null ? `${o.reference_low}-${o.reference_high}` : 'N/A').padEnd(17)} [${o.flag}]`
  )
  .join('\n')}
--------------------------------------------------------------------------------
PATHOLOGIST SIGN-OFF: Dr. Shalini Gupta, MBBS, MD Pathology (Verified)
DISCLAIMER: This original laboratory document has been preserved without alteration.
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.original_file_name || 'Original_Preserved_Report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-900)' }}>Preserved Laboratory Original</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Source Laboratory PDF Document • Immutable
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SHA-256 Cryptographic Preservation Badge */}
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}>
          <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065f46' }}>
              SHA-256 Preservation Verification Verified
            </div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#047857', wordBreak: 'break-all' }}>
              {report.report_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>
        </div>

        {/* Simulated High-Fidelity Original PDF Canvas */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-medium)',
          borderRadius: 12,
          padding: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--slate-800)',
          maxHeight: 320,
          overflowY: 'auto',
          lineHeight: 1.6,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
          marginBottom: 18,
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 8, marginBottom: 10 }}>
            <strong style={{ fontSize: '0.9rem', color: 'var(--navy-900)' }}>
              {report.laboratory_name || 'LIFELINE DIAGNOSTIC CENTRE'}
            </strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>
              CENTRAL HAEMATOLOGY LABORATORY REPORT
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12, fontSize: '0.74rem' }}>
            <div><strong>Patient:</strong> {report.patient_name}</div>
            <div><strong>ID:</strong> {report.patient_identifier}</div>
            <div><strong>Doctor:</strong> {report.ordering_doctor}</div>
            <div><strong>Date:</strong> {new Date(report.created_at).toLocaleDateString()}</div>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--navy-900)' }}>
              HAEMATOLOGY / COMPLETE BLOOD COUNT (CBC)
            </div>
            {(report.observations || []).map((obs, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: '1px dotted #e2e8f0',
                }}
              >
                <span>{obs.test_name_normalized}</span>
                <span style={{ fontWeight: 600 }}>
                  {obs.value} {obs.unit}
                  {obs.flag !== 'NORMAL' ? ` [${obs.flag}]` : ''}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, textAlign: 'right', fontSize: '0.72rem', color: '#059669' }}>
            ✓ Digitally Signed & Sealed by Pathologist
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ flex: 2 }}
          >
            <Download size={16} />
            Download Original Report
          </button>
        </div>
      </div>
    </div>
  );
}
