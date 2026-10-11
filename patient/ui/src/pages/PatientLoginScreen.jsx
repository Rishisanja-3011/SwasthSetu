import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, LockKeyhole, Smartphone } from 'lucide-react';
import { patientApi } from '../services/patientApi';
import { usePatient } from '../context/PatientContext';

function providerRoute(provider) {
  if (!provider?.provider_code) return '/';
  return `/scan/${provider.provider_type === 'LABORATORY' ? 'lab' : 'doctor'}/${provider.provider_code}`;
}

export function PatientLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setAuthenticatedSession } = usePatient();
  const pendingProviderCode = location.state?.pendingProviderCode || '';
  const returnTo = location.state?.returnTo || (pendingProviderCode ? `/scan/${pendingProviderCode}` : '/');

  const [step, setStep] = useState('PHONE');
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [pendingProvider, setPendingProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate(returnTo, { replace: true });
    return null;
  }

  const finishAuthentication = (result) => {
    setAuthenticatedSession(result.access_token, result.patient);
    navigate(result.pending_provider ? providerRoute(result.pending_provider) : returnTo, { replace: true });
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await patientApi.requestOtp({ phone, providerCode: pendingProviderCode || null });
      setChallengeId(result.challenge_id);
      setPendingProvider(result.pending_provider);
      setStep('OTP');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await patientApi.verifyOtp({ challengeId, otp });
      if (result.registration_required) {
        setRegistrationToken(result.registration_token);
        setPendingProvider(result.pending_provider || pendingProvider);
        setStep('REGISTRATION');
      } else {
        finishAuthentication(result);
      }
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await patientApi.registerPatient({
        registrationToken,
        name,
        age,
        dateOfBirth,
        gender,
      });
      finishAuthentication({ ...result, pending_provider: result.pending_provider || pendingProvider });
    } catch (registrationError) {
      setError(registrationError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in page-centered-container" style={{ maxWidth: 500, padding: '28px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg, var(--teal-500), var(--blue-600))', color: '#fff', marginBottom: 14 }}>
          <Activity size={30} />
        </div>
        <h1 style={{ fontSize: '1.55rem', color: 'var(--navy-900)', marginBottom: 6 }}>Patient Login</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', margin: 0 }}>
          Use your verified mobile number to open your patient-owned record.
        </p>
      </div>

      {pendingProvider && (
        <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-200)', borderRadius: 12, padding: '11px 13px', marginBottom: 14, fontSize: '0.82rem', color: 'var(--teal-900)' }}>
          QR destination saved: <strong>{pendingProvider.name}</strong>. It will reopen after login.
        </div>
      )}

      <div className="v-card" style={{ padding: 22 }}>
        {step === 'PHONE' && (
          <form onSubmit={handleRequestOtp}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>
              Mobile number
            </label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Smartphone size={17} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" required style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 9, border: '1px solid var(--border-medium)', fontSize: '0.95rem' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Sending OTP...' : <>Continue with OTP <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--teal-700)', fontSize: '0.84rem', fontWeight: 700, marginBottom: 14 }}>
              <LockKeyhole size={17} /> OTP sent to {phone}
            </div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>Six-digit OTP</label>
            <input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '1px solid var(--border-medium)', fontSize: '1.2rem', letterSpacing: '0.28em', textAlign: 'center', marginBottom: 14 }} />
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : <>Verify mobile number <CheckCircle2 size={18} /></>}
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => { setStep('PHONE'); setError(''); }} style={{ marginTop: 8 }}>Use a different number</button>
          </form>
        )}

        {step === 'REGISTRATION' && (
          <form onSubmit={handleRegistration}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--navy-900)', marginBottom: 4 }}>Create your patient record</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0 }}>This mobile number is not registered yet.</p>
            </div>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" required style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-medium)', marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input type="number" min="0" max="130" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Age" style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-medium)' }} />
              <select value={gender} onChange={(event) => setGender(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-medium)' }}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--slate-500)', marginBottom: 5 }}>Date of birth (optional if age is provided)</label>
            <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-medium)', marginBottom: 14 }} />
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || (!age && !dateOfBirth)}>
              {loading ? 'Creating record...' : <>Create Patient ID <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {error && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 9, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.82rem' }}>{error}</div>}
      </div>
    </div>
  );
}
