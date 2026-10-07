import React, { useState } from 'react';
import { Activity, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LabLoginView({ onLogin, lab }) {
  const [username, setUsername] = useState('shalini.gupta@lifelinelab.in');
  const [password, setPassword] = useState('••••••••');
  const [labCode, setLabCode] = useState(lab?.qr_code_id || 'LAB-808');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: 'Dr. Shalini Gupta',
      role: 'Senior Hematopathologist',
      labCode,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-page)',
        padding: '1.5rem',
      }}
    >
      <div
        className="clinical-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-icon-box"
            style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}
          >
            <Activity size={26} />
          </div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--navy-900)',
              letterSpacing: '-0.02em',
            }}
          >
            VaaniDoc
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--teal-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '0.15rem',
            }}
          >
            Laboratory Portal
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Diagnostic sign-in for authorized laboratory personnel
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Lab Code */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              Laboratory Facility ID
            </label>
            <input
              type="text"
              value={labCode}
              onChange={(e) => setLabCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-surface)',
              }}
              required
            />
          </div>

          {/* User Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              Operator Email / Staff ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.88rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-surface)',
                }}
                required
              />
              <User
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Security PIN / Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
              }}
            >
              Security Password / PIN
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.88rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-surface)',
                }}
                required
              />
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="btn-clinical primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
          >
            <span>Sign In to Laboratory Portal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} color="var(--teal-600)" />
          <span>VaaniDoc 2.0 Bounded Security Compliant</span>
        </div>
      </div>
    </div>
  );
}
