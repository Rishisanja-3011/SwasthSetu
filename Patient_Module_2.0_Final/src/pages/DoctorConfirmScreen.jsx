import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, CheckCircle2, RefreshCw, Building2, Award } from 'lucide-react';
import { patientApi, REGISTERED_DOCTORS } from '../services/patientApi';
import { DoctorConfirmSkeleton } from '../components/Skeleton';

export function DoctorConfirmScreen() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const initDoctor = async () => {
      setLoading(true);
      const start = Date.now();
      try {
        let doc = location.state?.doctor || patientApi.getSessionDoctor();
        if (!doc) {
          doc = REGISTERED_DOCTORS[0];
        }
        patientApi.saveSessionDoctor(doc);

        const elapsed = Date.now() - start;
        if (elapsed < 320) {
          await new Promise((resolve) => setTimeout(resolve, 320 - elapsed));
        }

        if (isMounted) {
          setDoctor(doc);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    initDoctor();
    return () => {
      isMounted = false;
    };
  }, [location.state]);

  const handleConfirm = () => {
    if (!doctor) return;
    patientApi.saveSessionDoctor(doctor);
    navigate('/visit-type', { state: { doctor } });
  };

  const handleScanAgain = () => {
    navigate('/');
  };

  if (loading || !doctor) {
    return <DoctorConfirmSkeleton />;
  }

  return (
    <div className="skeleton-content-fade page-centered-container" style={{ maxWidth: 620, padding: '12px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--deep-indigo)',
          backgroundColor: 'var(--lavender-soft)',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--lavender-200)',
          display: 'inline-block',
          marginBottom: 12,
        }}>
          QR Code Verified • {doctor.qr_code_id}
        </span>
        <h2 style={{ fontSize: '1.45rem', color: 'var(--main-text)', marginBottom: 6, fontWeight: 800 }}>
          Confirm Your Doctor
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)' }}>
          Please confirm that you are visiting the correct physician before proceeding to consultation.
        </p>
      </div>

      {/* Doctor Card */}
      <div className="v-card" style={{
        padding: '24px 22px',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(90deg, var(--lavender) 0%, var(--deep-indigo) 100%)',
        }} />

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--lavender-soft)',
            color: 'var(--deep-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid var(--lavender-200)',
          }}>
            <Stethoscope size={30} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--main-text)', marginBottom: 2, fontWeight: 800 }}>
              {doctor.name}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--deep-indigo)', fontWeight: 600 }}>
              {doctor.specialty}
            </p>
            <div style={{
              display: 'inline-block',
              marginTop: 6,
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--deep-indigo)',
              backgroundColor: 'var(--lavender-soft)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--lavender-200)',
            }}>
              CODE: {doctor.qr_code_id} • {doctor.room_number || 'Cabin 2'}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: 'var(--main-text)', marginBottom: 8 }}>
            <Building2 size={16} color="var(--lavender)" />
            <span>Clinic: <strong>{doctor.clinic_name}</strong></span>
          </div>

          {doctor.languages && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--muted-text)' }}>
              <Award size={16} color="var(--lavender)" />
              <span>Languages: {doctor.languages.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={handleConfirm}
        >
          <CheckCircle2 size={20} />
          <span>Confirm Doctor & Continue</span>
        </button>

        <button
          className="btn btn-secondary btn-block"
          onClick={handleScanAgain}
        >
          <RefreshCw size={16} />
          <span>Scan Again / Wrong Doctor</span>
        </button>
      </div>
    </div>
  );
}
