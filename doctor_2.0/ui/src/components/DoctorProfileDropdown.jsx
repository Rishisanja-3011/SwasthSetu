import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Download, ShieldCheck, Sparkles, Building, UserCheck } from 'lucide-react';
import { useDoctorAuth } from '../context/DoctorAuthContext';

export const DoctorProfileDropdown = ({ isOpen, onClose }) => {
  const { doctor } = useDoctorAuth();
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  const doctorName = doctor?.name || 'Dr. Ramesh Mehta';
  const doctorCode = doctor?.doctor_code || doctor?.qr_code_id || 'DOC-409';
  const specialty = doctor?.specialty || 'General Physician & Family Medicine';
  const clinicName = doctor?.clinic_name || 'Mehta Community Health Clinic';
  const initial = doctorName.replace('Dr. ', '').charAt(0) || 'D';

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(doctorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgEl = document.getElementById('doctor-profile-qr-svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 800;
    canvas.height = 800;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `doctor-qr-${doctorCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <>
      <div
        className="profile-backdrop"
        onClick={onClose}
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 45, 53, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
        }}
      />

      <div
        ref={dropdownRef}
        className="fade-in profile-dropdown-container"
        style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: 380,
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--neo-raised-lg)',
          zIndex: 999,
          padding: 24,
          color: 'var(--main-text)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--main-text)' }}>
              Doctor Profile
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: 'var(--status-normal-bg)',
                color: 'var(--status-normal-text)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--status-normal-border)',
              }}
            >
              Active Station
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--muted-text)',
              cursor: 'pointer',
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--neo-inset-sm)',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Doctor Information */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16626C 0%, #0F4951 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.35rem',
              margin: '0 auto 10px auto',
              boxShadow: 'var(--neo-raised-sm)',
            }}
          >
            {initial}
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--main-text)', marginBottom: 2 }}>
            {doctorName}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--hospital-blue)', fontWeight: 700, margin: 0 }}>
            {specialty}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', marginTop: 2 }}>
            {clinicName} • Cabin 2
          </p>
        </div>

        {/* Doctor Code Box with Copy */}
        <div
          style={{
            backgroundColor: 'var(--surface-inset)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--neo-inset-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              Doctor Identifier Code
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--main-text)', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              {doctorCode}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
            }}
          >
            {copied ? (
              <>
                <Check size={14} color="#0D9488" />
                <span style={{ color: '#0D9488' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Doctor's Unique QR Code (High-Contrast Clean SVG) */}
        <div
          style={{
            padding: 16,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            marginBottom: 18,
            boxShadow: 'var(--neo-raised-sm)',
          }}
        >
          <div style={{ maxWidth: 160, margin: '0 auto 10px auto' }}>
            <svg
              id="doctor-profile-qr-svg"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 160 160"
              width="100%"
              height="100%"
              style={{ display: 'block' }}
            >
              <rect width="160" height="160" fill="#ffffff" />
              {/* Corner Markers */}
              <rect x="10" y="10" width="40" height="40" fill="#1A2D35" rx="5" />
              <rect x="16" y="16" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="22" y="22" width="16" height="16" fill="#2292A0" rx="2" />

              <rect x="110" y="10" width="40" height="40" fill="#1A2D35" rx="5" />
              <rect x="116" y="16" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="122" y="22" width="16" height="16" fill="#2292A0" rx="2" />

              <rect x="10" y="110" width="40" height="40" fill="#1A2D35" rx="5" />
              <rect x="16" y="116" width="28" height="28" fill="#ffffff" rx="2" />
              <rect x="22" y="122" width="16" height="16" fill="#2292A0" rx="2" />

              {/* Data matrix pattern */}
              <rect x="60" y="15" width="8" height="16" fill="#1A2D35" />
              <rect x="75" y="20" width="16" height="8" fill="#1A2D35" />
              <rect x="95" y="15" width="8" height="8" fill="#1A2D35" />

              <rect x="60" y="45" width="40" height="8" fill="#1A2D35" />
              <rect x="15" y="60" width="20" height="8" fill="#1A2D35" />
              <rect x="45" y="60" width="12" height="12" fill="#2292A0" />
              <rect x="65" y="60" width="30" height="30" fill="#1A2D35" rx="4" />
              <rect x="105" y="60" width="15" height="8" fill="#1A2D35" />
              <rect x="130" y="60" width="15" height="15" fill="#1A2D35" />

              <rect x="20" y="80" width="15" height="8" fill="#1A2D35" />
              <rect x="45" y="80" width="8" height="20" fill="#1A2D35" />
              <rect x="110" y="80" width="10" height="20" fill="#1A2D35" />
              <rect x="130" y="85" width="15" height="8" fill="#1A2D35" />

              <rect x="60" y="100" width="10" height="10" fill="#1A2D35" />
              <rect x="80" y="100" width="15" height="15" fill="#2292A0" />
              <rect x="105" y="105" width="20" height="8" fill="#1A2D35" />
              <rect x="135" y="105" width="10" height="15" fill="#1A2D35" />

              <rect x="60" y="125" width="20" height="8" fill="#1A2D35" />
              <rect x="90" y="125" width="15" height="15" fill="#1A2D35" />
              <rect x="115" y="125" width="10" height="8" fill="#1A2D35" />
              <rect x="135" y="130" width="12" height="12" fill="#1A2D35" />

              <rect x="60" y="140" width="10" height="10" fill="#1A2D35" />
              <rect x="75" y="140" width="8" height="10" fill="#1A2D35" />
              <rect x="115" y="140" width="25" height="8" fill="#2292A0" />

              {/* Center Doctor Tag */}
              <circle cx="80" cy="80" r="16" fill="#ffffff" />
              <circle cx="80" cy="80" r="13" fill="#2292A0" />
              <text x="80" y="84" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">DOC</text>
            </svg>
          </div>

          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--main-text)' }}>
            Scan to consult {doctorName}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--muted-text)', marginTop: 2 }}>
            Patients scan this QR to join your consultation queue
          </div>
        </div>

        {/* Download Clinic QR Action Button */}
        <button
          onClick={handleDownloadQR}
          className="btn btn-secondary btn-block"
          style={{ fontSize: '0.84rem', marginBottom: 12 }}
          title={`Download doctor QR code as doctor-qr-${doctorCode}.png`}
        >
          <Download size={15} />
          <span>Download Clinic QR PNG</span>
        </button>

        {/* Privacy Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.74rem',
            color: 'var(--muted-text)',
            textAlign: 'center',
            paddingTop: 10,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <ShieldCheck size={14} color="var(--hospital-blue)" />
          <span>Doctor identity linked exclusively to your queue</span>
        </div>
      </div>
    </>
  );
};
