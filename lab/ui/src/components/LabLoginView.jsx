import React, { useState } from 'react';
import { Activity, User, ArrowRight, ShieldCheck, Building2, MapPin } from 'lucide-react';

export default function LabLoginView({ onLogin, onRegister, lab }) {
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [labCode, setLabCode] = useState(lab?.qr_code_id || '');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await onRegister({ name, phone, location });
      } else {
        await onLogin({ labCode, phone });
      }
    } catch (error) {
      setErrorMessage(error.message || `Laboratory ${isRegistering ? 'registration' : 'sign-in'} failed.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', padding: '1.5rem' }}>
      <div className="clinical-card" style={{ maxWidth: '470px', width: '100%', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-icon-box" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}><Activity size={26} /></div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>VaaniDoc</h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-600)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.15rem' }}>Laboratory Portal</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{isRegistering ? 'Register your facility and receive its VaaniDoc ID' : 'Sign in with your laboratory ID and registered phone'}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '1.4rem' }}>
          <button type="button" onClick={() => switchMode('login')} style={{ border: 0, borderRadius: 7, padding: '0.6rem', background: !isRegistering ? 'white' : 'transparent', color: !isRegistering ? 'var(--teal-700)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', boxShadow: !isRegistering ? 'var(--shadow-xs)' : 'none' }}>Returning lab</button>
          <button type="button" onClick={() => switchMode('register')} style={{ border: 0, borderRadius: 7, padding: '0.6rem', background: isRegistering ? 'white' : 'transparent', color: isRegistering ? 'var(--teal-700)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', boxShadow: isRegistering ? 'var(--shadow-xs)' : 'none' }}>Self-register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegistering && <>
            <label className="lab-auth-label" htmlFor="lab-name">Laboratory name</label>
            <div className="lab-auth-input-wrap"><Building2 size={16} /><input id="lab-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Sunrise Diagnostics" required /></div>
            <label className="lab-auth-label" htmlFor="lab-location">City or facility location <span>(optional)</span></label>
            <div className="lab-auth-input-wrap"><MapPin size={16} /><input id="lab-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Ahmedabad" /></div>
          </>}

          {!isRegistering && <>
            <label className="lab-auth-label" htmlFor="lab-code">Laboratory ID / QR code</label>
            <div className="lab-auth-input-wrap"><Building2 size={16} /><input id="lab-code" value={labCode} onChange={(event) => setLabCode(event.target.value.toUpperCase())} placeholder="LAB-123456" required /></div>
          </>}

          <label className="lab-auth-label" htmlFor="lab-phone">Registered laboratory phone</label>
          <div className="lab-auth-input-wrap"><User size={16} /><input id="lab-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 90000 00000" required /></div>

          <p style={{ margin: '0.5rem 0 1.15rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{isRegistering ? 'Your facility is active immediately. We generate a unique laboratory ID for patient QR scanning and future sign-in.' : 'The phone must match the number used when this laboratory was registered.'}</p>
          {errorMessage && <div style={{ marginBottom: '1rem', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.8rem' }}>{errorMessage}</div>}
          {successMessage && <div style={{ marginBottom: '1rem', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--teal-50)', color: 'var(--teal-800)', fontSize: '0.8rem' }}>{successMessage}</div>}
          <button type="submit" className="btn-clinical primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} disabled={isSubmitting}>
            <span>{isSubmitting ? (isRegistering ? 'Registering...' : 'Signing in...') : (isRegistering ? 'Register laboratory' : 'Sign in to laboratory')}</span><ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><ShieldCheck size={14} color="var(--teal-600)" /><span>Bounded patient access is enforced per laboratory grant</span></div>
      </div>
    </div>
  );
}
