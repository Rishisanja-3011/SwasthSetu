import React, { useState } from 'react';
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

export function IntakeReviewScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient, updateActiveEncounter } = usePatient();

  const doctor = location.state?.doctor;
  const visitType = location.state?.visitType || 'NEW';
  const doctorAccessGranted = location.state?.doctorAccessGranted || false;
  const inputMode = location.state?.inputMode || 'voice';
  const rawTranscript = location.state?.rawTranscript || '';
  const initialStructured = location.state?.structuredData || {
    chief_complaint: 'Weakness',
    duration: '3 days',
    symptoms: ['Dizziness'],
    confidence: 0.94,
  };

  if (!doctor) {
    navigate('/');
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState(initialStructured.chief_complaint);
  const [duration, setDuration] = useState(initialStructured.duration);
  const [symptomsList, setSymptomsList] = useState(initialStructured.symptoms.join(', '));
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmAndJoinQueue = async () => {
    setSubmitting(true);
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
        chief_complaint: chiefComplaint.trim(),
        duration: duration.trim(),
        symptoms: symptomsList.split(',').map((s) => s.trim()).filter(Boolean),
        confidence: initialStructured.confidence,
      };

      await patientApi.submitIntake({
        encounterId: encounter.id,
        inputMode,
        rawTranscript,
        structuredData: structured,
        confidence: initialStructured.confidence,
      });

      updateActiveEncounter(encounter);

      // 3. Navigate to Live Waiting Cockpit
      navigate('/waiting', { replace: true });
    } catch (err) {
      alert('Error joining queue: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in page-centered-container" style={{ maxWidth: 960, padding: '8px 0' }}>
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
                <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                  Mode: {inputMode}
                </span>
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

          {/* Confirmation CTA */}
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
            onClick={handleConfirmAndJoinQueue}
            style={{ marginBottom: 14 }}
          >
            <CheckCircle2 size={20} />
            {submitting ? 'Entering Queue...' : 'Confirm & Join Doctor Queue'}
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
