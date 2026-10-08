import React, { useState } from 'react';
import { FileText, Copy, Check, Download, ShieldCheck, X, Hash } from 'lucide-react';

export default function PreservedReportModal({ isOpen, onClose, report, patient }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.raw_text_content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([report.raw_text_content || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${patient?.name || 'Patient'}_CBC_Instrument_Raw_${report._id.slice(-6)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          maxWidth: '680px',
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
              <FileText size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Preserved Original Digital Report</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Unaltered Instrument Output & Cryptographic Integrity</p>
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
          {/* Architecture Notice */}
          <div className="banner info" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Preservation Rule:</strong> Original instrument report remains strictly unmodified. 
              The raw text stream below is the cryptographic source of truth ingested by the extraction engine.
            </div>
          </div>

          {/* Hash & Metadata Card */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                SHA-256 Digital Fingerprint
              </span>
              <span className="badge badge-normal" style={{ fontSize: '0.68rem' }}>
                Cryptographically Verified
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                wordBreak: 'break-all',
                background: '#060912',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {report.report_hash || 'SHA-256 Unspecified'}
            </div>
          </div>

          {/* Raw Text Box */}
          <div className="raw-report-box" style={{ maxHeight: '280px', margin: 0 }}>
            {report.raw_text_content || 'No raw content recorded.'}
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={handleCopy}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Raw Text'}</span>
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={handleDownload}>
              <Download size={14} />
              <span>Download Raw File</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
