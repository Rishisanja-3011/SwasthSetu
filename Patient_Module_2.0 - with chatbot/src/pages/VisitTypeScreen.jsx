import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Shield, AlertCircle, ArrowLeft } from 'lucide-react';

export function VisitTypeScreen() {
  const location = useLocation();
  const navigate = useNavigate();

  const doctor = location.state?.doctor;

  if (!doctor) {
    navigate('/');
    return null;
  }

  const handleSelectVisitType = (visitType) => {
    if (visitType === 'REVISITING') {
      navigate('/doctor-access-permission', {
        state: { doctor },
      });
    } else {
      navigate('/intake', {
        state: {
          doctor,
          visitType: 'NEW',
          doctorAccessGranted: false,
        },
      });
    }
  };

  return (
    <div className="fade-in page-centered-container" style={{ maxWidth: 820, padding: '8px 0' }}>
      <button
        onClick={() => navigate('/doctor-confirm', { state: { doctor } })}
        className="btn btn-secondary"
        style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.45rem', color: 'var(--navy-900)', marginBottom: 6 }}>
          Why are you visiting today?
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)' }}>
          Visiting <strong>{doctor.name}</strong> • Choose your consultation type
        </p>
      </div>

      <div className="visit-type-grid">
        {/* Choice 1: NEW CONSULTATION */}
        <div
          className="v-card"
          onClick={() => handleSelectVisitType('NEW')}
          style={{
            padding: 22,
            border: '2px solid var(--border-subtle)',
            borderRadius: 16,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--teal-500)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: 'var(--teal-50)',
              color: 'var(--teal-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserPlus size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-900)' }}>NEW CONSULTATION</h3>
                <span className="status-pill active" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  Intake Mandatory
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)', marginBottom: 8 }}>
                First time seeing this doctor or discussing a new medical problem.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--teal-800)', backgroundColor: 'var(--teal-50)', padding: '6px 10px', borderRadius: 8 }}>
                ✓ Voice/text symptom description required
                <br />
                🔒 Prior records & notes remain locked from this doctor
              </div>
            </div>
          </div>
        </div>

        {/* Choice 2: REVISITING */}
        <div
          className="v-card"
          onClick={() => handleSelectVisitType('REVISITING')}
          style={{
            padding: 22,
            border: '2px solid var(--border-subtle)',
            borderRadius: 16,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--blue-500)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: 'var(--blue-50)',
              color: 'var(--blue-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserCheck size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--navy-900)' }}>REVISITING</h3>
                <span className="status-pill low" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  Intake Optional
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)', marginBottom: 8 }}>
                Follow-up visit. I have consulted {doctor.name} before.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--blue-800)', backgroundColor: 'var(--blue-50)', padding: '6px 10px', borderRadius: 8 }}>
                ✓ Symptom description is optional (can skip)
                <br />
                📋 Unlocks your prior notes by Dr. Mehta & published blood reports while consultation is open
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: 10, fontSize: '0.78rem', color: 'var(--slate-500)' }}>
        <Shield size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        Doctor access is bounded strictly to this consultation and terminates when consultation ends.
      </div>
    </div>
  );
}
