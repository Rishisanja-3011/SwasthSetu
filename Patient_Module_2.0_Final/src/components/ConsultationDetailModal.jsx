import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  Pill,
  Mic,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Activity,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { patientApi } from '../services/patientApi';
import { StatusBadge } from './StatusBadge';
import './ConsultationDetailModal.css';

export function ConsultationDetailModal({
  isOpen,
  onClose,
  encounterId,
  patientIdentifier,
  initialTargetSection = null,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lock body scroll while modal is active & clean up on close or unmount
  useEffect(() => {
    if (!isOpen || !encounterId) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, encounterId]);

  useEffect(() => {
    if (!isOpen || !encounterId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    patientApi
      .getConsultationDetails(encounterId, patientIdentifier)
      .then((details) => {
        if (isMounted) {
          setData(details);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve consultation details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, encounterId, patientIdentifier]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !encounterId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, encounterId, onClose]);

  // If not open or no encounterId, guarantee nothing (no overlay/backdrop) is rendered
  if (!isOpen || !encounterId) return null;

  const overview = data?.overview || {};
  const original = data?.original_symptoms || {};
  const structured = data?.structured_symptoms || {};
  const notes = data?.doctor_notes || {};
  const rx = data?.prescriptions || {};
  const summary = data?.summary || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return createPortal(
    <div
      className="consultation-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-modal-title"
    >
      <div className="consultation-modal-container">
        {/* Sticky Header */}
        <div className="consultation-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(34, 146, 160, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--hospital-blue)',
              }}
            >
              <Stethoscope size={22} />
            </div>
            <div>
              <h3
                id="consultation-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--main-text)',
                  lineHeight: 1.2,
                }}
              >
                Consultation Details
              </h3>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '0.78rem',
                  color: 'var(--muted-text)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Encounter ID: {encounterId || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="consultation-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="consultation-modal-body">
          {/* Loading Skeleton State */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                className="detail-section-card"
                style={{
                  minHeight: 120,
                  background: 'linear-gradient(90deg, #f0f4f8 25%, #e6eef2 50%, #f0f4f8 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div
                className="detail-section-card"
                style={{
                  minHeight: 140,
                  background: 'linear-gradient(90deg, #f0f4f8 25%, #e6eef2 50%, #f0f4f8 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
              <div
                className="detail-section-card"
                style={{
                  minHeight: 160,
                  background: 'linear-gradient(90deg, #f0f4f8 25%, #e6eef2 50%, #f0f4f8 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            </div>
          )}

          {/* Error State with Retry & Dismiss */}
          {!loading && error && (
            <div className="modal-error-box">
              <AlertCircle size={32} style={{ margin: '0 auto 10px auto', color: '#E53E3E' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#9B2C2C' }}>
                Unable to Load Consultation
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.86rem', color: '#C53030' }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="v-button v-button-primary"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    patientApi.getConsultationDetails(encounterId, patientIdentifier)
                      .then((d) => {
                        setData(d);
                        setLoading(false);
                      })
                      .catch((err) => {
                        setError(err.message || 'Failed to retrieve consultation details');
                        setLoading(false);
                      });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={15} />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  className="v-button v-button-secondary"
                  onClick={onClose}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Dismiss & Return to Timeline</span>
                </button>
              </div>
            </div>
          )}

          {/* Data State */}
          {!loading && !error && data && (
            <>
              {/* SECTION A: Consultation Overview */}
              <div className="detail-section-card" id="section-overview">
                <div className="detail-section-header">
                  <div className="detail-section-title">
                    <div
                      className="detail-section-icon"
                      style={{ backgroundColor: 'rgba(34, 146, 160, 0.12)', color: 'var(--hospital-blue)' }}
                    >
                      <Stethoscope size={18} />
                    </div>
                    <span>Consultation Overview</span>
                  </div>
                  {overview.status && (
                    <StatusBadge status={overview.status} />
                  )}
                </div>

                <div className="overview-grid">
                  <div className="overview-item">
                    <span className="overview-label">Encounter ID</span>
                    <span className="overview-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {overview.encounter_id || encounterId}
                    </span>
                  </div>

                  <div className="overview-item">
                    <span className="overview-label">Date & Time</span>
                    <span className="overview-value">
                      {formatDate(overview.date || overview.started_at)}
                      {overview.date && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', marginLeft: 6, fontWeight: 500 }}>
                          {formatTime(overview.date || overview.started_at)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="overview-item">
                    <span className="overview-label">Doctor</span>
                    <span className="overview-value">
                      {overview.doctor_name || 'Dr. Ramesh Mehta'}
                      {overview.doctor_specialty && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 500 }}>
                          {overview.doctor_specialty}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="overview-item">
                    <span className="overview-label">Clinic & Cabin</span>
                    <span className="overview-value">
                      {overview.clinic_name || 'Community Health Clinic'}
                      {overview.room_number && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 500 }}>
                          {overview.room_number}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="overview-item">
                    <span className="overview-label">Visit Type</span>
                    <span className="overview-value">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          backgroundColor: overview.visit_type === 'REVISITING' ? 'rgba(45, 49, 166, 0.08)' : 'rgba(0, 168, 132, 0.08)',
                          color: overview.visit_type === 'REVISITING' ? 'var(--deep-indigo)' : 'var(--healthcare-teal)',
                        }}
                      >
                        {overview.visit_type || 'STANDARD'}
                      </span>
                    </span>
                  </div>

                  <div className="overview-item">
                    <span className="overview-label">Patient</span>
                    <span className="overview-value">
                      {data.patient?.name || 'Rahul Sharma'}
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                        {data.patient?.patient_identifier || patientIdentifier || 'PT-2026-4401'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: Original Patient Input */}
              <div className="detail-section-card" id="section-original-symptoms">
                <div className="detail-section-header">
                  <div className="detail-section-title">
                    <div
                      className="detail-section-icon"
                      style={{ backgroundColor: 'rgba(0, 168, 132, 0.12)', color: 'var(--healthcare-teal)' }}
                    >
                      {original.input_mode === 'voice' ? <Mic size={18} /> : <MessageSquare size={18} />}
                    </div>
                    <span>Original Symptoms</span>
                  </div>
                  <span className="provenance-pill patient">
                    <User size={12} />
                    Original Patient Input
                  </span>
                </div>

                {original.available && original.raw_transcript ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 10,
                        fontSize: '0.78rem',
                        color: 'var(--muted-text)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--main-text)' }}>Mode:</span>
                        <span style={{ textTransform: 'capitalize' }}>
                          {original.input_mode || 'Voice intake'}
                        </span>
                        {original.detected_language && (
                          <span style={{ background: '#EEF2F6', padding: '1px 7px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                            {original.detected_language}
                          </span>
                        )}
                      </div>

                      {original.submitted_at && (
                        <div>
                          <span>Submitted: </span>
                          <span style={{ fontWeight: 600, color: 'var(--main-text)' }}>
                            {formatDate(original.submitted_at)} {formatTime(original.submitted_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verbatim quote from patient */}
                    <div className="original-quote-box">
                      “{original.raw_transcript}”
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {original.duration && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--main-text)' }}>
                          <span style={{ color: 'var(--muted-text)', fontWeight: 600 }}>Reported Duration: </span>
                          <strong>{original.duration}</strong>
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-text)', fontStyle: 'italic' }}>
                        Verbatim raw text recorded during intake.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-empty-box">
                    <Info size={22} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--main-text)' }}>
                      No Original Symptom Recording Found
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                      No raw intake transcript was recorded for this consultation.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION C: Structured Symptoms */}
              <div className="detail-section-card" id="section-structured-symptoms">
                <div className="detail-section-header">
                  <div className="detail-section-title">
                    <div
                      className="detail-section-icon"
                      style={{ backgroundColor: 'rgba(45, 49, 166, 0.1)', color: 'var(--deep-indigo)' }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <span>Structured Symptoms</span>
                  </div>
                  <span className="provenance-pill ai">
                    <Sparkles size={12} />
                    AI Structured Analysis
                  </span>
                </div>

                {structured.available ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Chief Complaint */}
                    {structured.chief_complaint && (
                      <div
                        style={{
                          backgroundColor: '#F3F8FA',
                          border: '1px solid #D5E8EE',
                          borderRadius: 12,
                          padding: '12px 16px',
                        }}
                      >
                        <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--hospital-blue)', letterSpacing: 0.4 }}>
                          Chief Complaint
                        </span>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--main-text)', marginTop: 2 }}>
                          {structured.chief_complaint}
                        </div>
                      </div>
                    )}

                    {/* Symptoms list */}
                    {Array.isArray(structured.symptoms) && structured.symptoms.length > 0 && (
                      <div>
                        <span className="overview-label" style={{ display: 'block', marginBottom: 6 }}>
                          Identified Symptoms
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {structured.symptoms.map((sym, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid var(--border-medium, #C0DCE4)',
                                padding: '5px 12px',
                                borderRadius: 8,
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: 'var(--main-text)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--deep-indigo)' }} />
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Duration & Severity Meta */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 4 }}>
                      {structured.duration && (
                        <div className="overview-item">
                          <span className="overview-label">Duration</span>
                          <span className="overview-value" style={{ fontSize: '0.88rem' }}>{structured.duration}</span>
                        </div>
                      )}
                      {structured.severity && (
                        <div className="overview-item">
                          <span className="overview-label">Severity</span>
                          <span className="overview-value" style={{ fontSize: '0.88rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                backgroundColor:
                                  structured.severity.toLowerCase().includes('high') || structured.severity.toLowerCase().includes('severe')
                                    ? '#FED7D7'
                                    : structured.severity.toLowerCase().includes('mod')
                                    ? '#FEFCBF'
                                    : '#C6F6D5',
                                color:
                                  structured.severity.toLowerCase().includes('high') || structured.severity.toLowerCase().includes('severe')
                                    ? '#C53030'
                                    : structured.severity.toLowerCase().includes('mod')
                                    ? '#975A16'
                                    : '#22543D',
                              }}
                            >
                              {structured.severity}
                            </span>
                          </span>
                        </div>
                      )}
                      {structured.confidence && (
                        <div className="overview-item">
                          <span className="overview-label">Extraction Confidence</span>
                          <span className="overview-value" style={{ fontSize: '0.88rem' }}>
                            {Math.round(structured.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Associated Symptoms */}
                    {Array.isArray(structured.associated_symptoms) && structured.associated_symptoms.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <span className="overview-label" style={{ display: 'block', marginBottom: 6 }}>
                          Associated Symptoms
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {structured.associated_symptoms.map((asym, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#F8FAFC',
                                border: '1px dashed var(--border-medium, #C0DCE4)',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.78rem',
                                color: 'var(--muted-text)',
                              }}
                            >
                              {asym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="detail-empty-box">
                    <Info size={22} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--main-text)' }}>
                      No Structured Symptoms Available
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                      No structured symptom fields were saved for this encounter.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION D: Doctor's Notes and Advice */}
              <div className="detail-section-card" id="section-doctor-notes">
                <div className="detail-section-header">
                  <div className="detail-section-title">
                    <div
                      className="detail-section-icon"
                      style={{ backgroundColor: 'rgba(29, 78, 216, 0.1)', color: '#1D4ED8' }}
                    >
                      <FileText size={18} />
                    </div>
                    <span>Doctor's Notes and Advice</span>
                  </div>
                  <span className="provenance-pill doctor">
                    <Stethoscope size={12} />
                    Doctor's Verified Record
                  </span>
                </div>

                {notes.available ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Clinical Assessment / Diagnosis */}
                    {notes.assessment && (
                      <div
                        style={{
                          backgroundColor: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: 12,
                          padding: '12px 16px',
                        }}
                      >
                        <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#0369A1', letterSpacing: 0.4 }}>
                          Clinical Assessment / Diagnosis
                        </span>
                        <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0C4A6E', marginTop: 2 }}>
                          {notes.assessment}
                        </div>
                      </div>
                    )}

                    {/* Clinical Observations / Notes */}
                    {notes.notes_text && (
                      <div>
                        <span className="overview-label" style={{ display: 'block', marginBottom: 4 }}>
                          Consultation Notes & Observations
                        </span>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.6,
                            color: 'var(--main-text)',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border-subtle, #E2EFF2)',
                            borderRadius: 10,
                            padding: '12px 14px',
                          }}
                        >
                          {notes.notes_text}
                        </div>
                      </div>
                    )}

                    {/* Advice given to patient */}
                    {notes.advice && (
                      <div>
                        <span className="overview-label" style={{ display: 'block', marginBottom: 4 }}>
                          Advice Given to Patient
                        </span>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.6,
                            color: 'var(--main-text)',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: 10,
                            padding: '12px 14px',
                          }}
                        >
                          {notes.advice}
                        </div>
                      </div>
                    )}

                    {/* Precautions and care instructions */}
                    {notes.precautions && (
                      <div>
                        <span className="overview-label" style={{ display: 'block', marginBottom: 4 }}>
                          Precautions & Care Instructions
                        </span>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.6,
                            color: 'var(--main-text)',
                            backgroundColor: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 10,
                            padding: '12px 14px',
                          }}
                        >
                          {notes.precautions}
                        </div>
                      </div>
                    )}

                    {/* Follow-up instructions & Follow-up Date */}
                    {(notes.follow_up_instructions || notes.follow_up_date) && (
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                          <span className="overview-label">Follow-up Instructions</span>
                          {notes.follow_up_date && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: 'var(--deep-indigo)',
                              }}
                            >
                              <Calendar size={13} />
                              Next Visit: {formatDate(notes.follow_up_date)}
                            </span>
                          )}
                        </div>
                        {notes.follow_up_instructions && (
                          <div style={{ fontSize: '0.86rem', color: 'var(--main-text)', lineHeight: 1.5 }}>
                            {notes.follow_up_instructions}
                          </div>
                        )}
                      </div>
                    )}

                    {notes.recorded_at && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-text)', textAlign: 'right' }}>
                        Recorded by {overview.doctor_name || 'Doctor'} on {formatDate(notes.recorded_at)} at {formatTime(notes.recorded_at)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="detail-empty-box">
                    <Info size={22} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--main-text)' }}>
                      No Doctor's Notes Recorded
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                      The attending doctor did not record clinical notes or advice for this consultation.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION E: Prescriptions */}
              <div className="detail-section-card" id="section-prescriptions">
                <div className="detail-section-header">
                  <div className="detail-section-title">
                    <div
                      className="detail-section-icon"
                      style={{ backgroundColor: 'rgba(235, 94, 40, 0.1)', color: '#D97706' }}
                    >
                      <Pill size={18} />
                    </div>
                    <span>Prescriptions</span>
                  </div>
                  {rx.available && rx.medicines?.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(0, 168, 132, 0.1)',
                        color: 'var(--healthcare-teal)',
                        padding: '3px 9px',
                        borderRadius: 9999,
                      }}
                    >
                      {rx.medicines.length} {rx.medicines.length === 1 ? 'Medicine' : 'Medicines'} Prescribed
                    </span>
                  )}
                </div>

                {rx.available && Array.isArray(rx.medicines) && rx.medicines.length > 0 ? (
                  <div>
                    <div className="prescriptions-table-wrapper">
                      <table className="prescriptions-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage & Route</th>
                            <th>Frequency & Duration</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rx.medicines.map((med, idx) => (
                            <tr key={med._id || idx}>
                              <td style={{ fontWeight: 700, color: 'var(--main-text)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Pill size={14} color="var(--deep-indigo)" />
                                  <span>{med.name}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{med.dosage || '—'}</span>
                                {med.route && (
                                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted-text)' }}>
                                    Route: {med.route}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{med.frequency || '—'}</span>
                                {med.duration && (
                                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted-text)' }}>
                                    For {med.duration}
                                  </span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                                {med.instructions || 'As directed by physician'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {rx.prescription_text && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '10px 14px',
                          borderRadius: 8,
                          backgroundColor: '#F8FAFC',
                          border: '1px solid var(--border-subtle, #E2EFF2)',
                          fontSize: '0.8rem',
                          color: 'var(--muted-text)',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--main-text)' }}>Prescription Summary: </span>
                        {rx.prescription_text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="detail-empty-box">
                    <Pill size={22} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--main-text)' }}>
                      No Prescription Recorded
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                      {rx.message || 'No prescription was recorded for this consultation.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Consultation Summary (if available) */}
              {summary.summary_text && (
                <div className="detail-section-card" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', border: '1px solid #BAE6FD' }}>
                  <div className="detail-section-header" style={{ marginBottom: 8 }}>
                    <div className="detail-section-title">
                      <div
                        className="detail-section-icon"
                        style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }}
                      >
                        <FileText size={16} />
                      </div>
                      <span style={{ color: '#0369A1' }}>{summary.label || 'Consultation Summary'}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#0C4A6E', lineHeight: 1.6, fontWeight: 500 }}>
                    {summary.summary_text}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle, #E2EFF2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            borderRadius: '0 0 var(--radius-xl, 24px) var(--radius-xl, 24px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--muted-text)' }}>
            <ShieldCheck size={14} color="var(--healthcare-teal)" />
            <span>End-to-End Encrypted Patient Health Record</span>
          </div>

          <button
            type="button"
            className="v-button v-button-secondary"
            onClick={onClose}
            style={{ padding: '7px 18px', fontSize: '0.84rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
