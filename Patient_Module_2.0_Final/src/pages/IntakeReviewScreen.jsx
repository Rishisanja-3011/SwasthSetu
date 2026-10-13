import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Edit3,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import { IntakeReviewSkeleton } from '../components/Skeleton';

export function IntakeReviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient, updateActiveEncounter } = usePatient();

  const [loading, setLoading] = useState(true);

  // Restore from navigation state or session storage on browser refresh
  const pendingIntake = patientApi.getPendingIntake();
  const doctor = location.state?.doctor || pendingIntake?.doctor || patientApi.getSessionDoctor();
  const visitType = location.state?.visitType || pendingIntake?.visitType || 'NEW';
  const doctorAccessGranted = location.state?.doctorAccessGranted !== undefined
    ? location.state.doctorAccessGranted
    : (pendingIntake?.doctorAccessGranted || false);
  const inputMode = location.state?.inputMode || pendingIntake?.inputMode || 'voice';
  const rawTranscript = location.state?.rawTranscript || pendingIntake?.rawTranscript || '';
  const detectedLanguage = location.state?.detectedLanguage || pendingIntake?.detectedLanguage || null;
  const initialStructured = location.state?.structuredData || pendingIntake?.structuredData || {
    chief_complaint: 'Weakness',
    duration: '3 days',
    symptoms: ['Dizziness'],
    confidence: 0.94,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState(initialStructured.chief_complaint);
  const [duration, setDuration] = useState(initialStructured.duration);
  const [symptomsList, setSymptomsList] = useState(initialStructured.symptoms?.join(', ') || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleConfirmAndJoinQueue = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create Encounter in OPEN state
      const encounter = await patientApi.createEncounter({
        patient,
        doctor,
        visitType,
        doctorAccessGranted,
      });

      // 2. Submit Structured Symptom Intake
      const structured = {
        chief_complaint: chiefComplaint.trim() || 'General Consultation',
        duration: duration.trim() || 'Not specified',
        symptoms: symptomsList.split(',').map((s) => s.trim()).filter(Boolean),
        confidence: initialStructured.confidence || 0.94,
      };

      await patientApi.submitIntake({
        encounterId: encounter.id,
        inputMode,
        rawTranscript,
        structuredData: structured,
        confidence: initialStructured.confidence || 0.94,
      });

      updateActiveEncounter(encounter);

      // Trigger cross-tab sync so doctor queue updates in real-time
      window.dispatchEvent(new Event('storage'));

      // 3. Navigate to Live Waiting Room
      navigate('/waiting', { replace: true });
    } catch (err) {
      console.error('Queue join error:', err);
      setSubmitError(err.message || 'Unable to register in queue. Please verify connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <IntakeReviewSkeleton />;
  }

  return (
    <div className="skeleton-content-fade page-centered-container" style={{ maxWidth: 960, padding: '8px 0' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--teal-700)',
          backgroundColor: 'var(--teal-50)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid var(--teal-200)',
          display: 'inline-block',
          marginBottom: 8,
        }}>
          Final Review Step
        </span>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: 4 }}>
          Review Your Symptom Intake
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)' }}>
          Please verify this interpretation before it reaches <strong>{doctor.name}</strong>.
        </p>
      </div>

      {/* Responsive Comparison Grid */}
      <div className="intake-review-grid">
        {/* Left Column: Raw Input */}
        <div>
          {rawTranscript ? (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: '18px',
              marginBottom: 16,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="provenance-tag patient">PATIENT_REPORTED • RAW INPUT</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {detectedLanguage && (
                    <span className="status-pill active" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {detectedLanguage.name || detectedLanguage}
                    </span>
                  )}
                  <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                    Mode: {inputMode}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                "{rawTranscript}"
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: '18px',
              marginBottom: 16,
            }}>
              <span className="provenance-tag patient">PATIENT_REPORTED</span>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-500)', marginTop: 8 }}>
                No raw transcript recorded.
              </p>
            </div>
          )}

          <div style={{
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--slate-600)',
            lineHeight: 1.45,
          }}>
            <ShieldCheck size={18} color="var(--teal-600)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            The doctor sees both your raw spoken words and this AI-assisted clinical breakdown. You can edit any field before submitting.
          </div>
        </div>

        {/* Right Column: AI Structured Interpretation & Submit */}
        <div>
          {/* AI Structured Interpretation Card */}
          <div className="v-card" style={{
            padding: 20,
            border: '2px solid var(--teal-300)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="provenance-tag ai">AI_GENERATED • STRUCTURED</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--teal-700)', fontWeight: 600 }}>
                  Confidence: {Math.round(initialStructured.confidence * 100)}%
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(!isEditing)}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                <Edit3 size={14} />
                {isEditing ? 'Done Editing' : 'Edit'}
              </button>
            </div>

            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    Chief Complaint / Main Problem:
                  </span>
                  <strong style={{ fontSize: '1.15rem', color: 'var(--navy-900)' }}>
                    {chiefComplaint}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                      Duration:
                    </span>
                    <span style={{ fontSize: '0.96rem', color: 'var(--slate-800)', fontWeight: 600 }}>
                      {duration}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                      Visit Type:
                    </span>
                    <span className="status-pill active" style={{ fontSize: '0.72rem' }}>
                      {visitType}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Additional Reported Symptoms:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {symptomsList.split(',').map((sym, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: 'var(--teal-50)',
                          color: 'var(--teal-900)',
                          border: '1px solid var(--teal-200)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 20,
                        }}
                      >
                        • {sym.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                    Chief Complaint:
                  </label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                    Duration:
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                    Other Symptoms (comma separated):
                  </label>
                  <input
                    type="text"
                    value={symptomsList}
                    onChange={(e) => setSymptomsList(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-medium)', fontSize: '0.92rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Feedback Banner */}
          {submitError && (
            <div
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--status-danger-text)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Confirmation CTA */}
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
            onClick={handleConfirmAndJoinQueue}
            style={{ marginBottom: 14 }}
          >
            <CheckCircle2 size={20} />
            <span>{submitting ? 'Entering Queue...' : 'Confirm & Join Doctor Queue'}</span>
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
            By confirming, this verified summary enters Dr. Mehta's queue.
            Doctor access expires automatically when consultation ends.
          </p>
        </div>
      </div>
    </div>
  );
}
