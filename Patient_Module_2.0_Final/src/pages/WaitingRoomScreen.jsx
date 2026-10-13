import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Eye,
  CheckCircle2,
  DoorOpen,
  ShieldCheck,
  Trash2,
  FileCheck,
  Stethoscope,
  Users,
  AlertCircle,
  RefreshCw,
  Building2,
  Sparkles,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import {
  Skeleton,
  SkeletonCard,
  SkeletonBadge,
} from '../components/Skeleton';
import './WaitingRoomScreen.css';

export function WaitingRoomScreen() {
  const navigate = useNavigate();
  const { activeEncounter: contextEncounter, updateActiveEncounter, clearEncounter } = usePatient();

  // Local state for encounter & queue details
  const [currentEncounter, setCurrentEncounter] = useState(() => {
    return contextEncounter || patientApi.getActiveEncounter();
  });
  const [currentStep, setCurrentStep] = useState(() => {
    return (
      contextEncounter?.lifecycle_state ||
      patientApi.getActiveEncounter()?.lifecycle_state ||
      'WAITING'
    );
  });
  const [clinicStatus, setClinicStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialEntrance, setIsInitialEntrance] = useState(false);
  const [statusUpdatedFeedback, setStatusUpdatedFeedback] = useState(false);

  // References to prevent stale updates and avoid replaying entrance animation
  const hasAnimatedRef = useRef(false);
  const requestIdRef = useRef(0);
  const prevStepRef = useRef(currentStep);

  // Core Data Fetcher & Queue Synchronizer
  const fetchQueueData = async (isInitial = false) => {
    const currentRequestId = ++requestIdRef.current;
    if (isInitial) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch current active encounter directly from API
      const encounter = patientApi.getActiveEncounter();
      let clinicData = null;

      if (encounter) {
        clinicData = await patientApi.getLiveClinicStatus(encounter.doctor_code || 'DOC-409');
      }

      // Discard stale responses if newer request was launched
      if (currentRequestId !== requestIdRef.current) return;

      if (encounter) {
        // If step changed dynamically from backend / Doctor action
        if (encounter.lifecycle_state !== prevStepRef.current) {
          prevStepRef.current = encounter.lifecycle_state;
          setCurrentStep(encounter.lifecycle_state);

          // Trigger subtle feedback glow if not initial load
          if (hasAnimatedRef.current) {
            setStatusUpdatedFeedback(true);
            setTimeout(() => setStatusUpdatedFeedback(false), 1400);
          }
        }

        setCurrentEncounter(encounter);
        setClinicStatus(clinicData);

        // Keep context in sync
        if (!contextEncounter || contextEncounter.lifecycle_state !== encounter.lifecycle_state) {
          updateActiveEncounter(encounter);
        }
      } else {
        setCurrentEncounter(null);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        console.error('Queue data fetch error:', err);
        setError(err.message || 'Unable to communicate with clinic server.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current && isInitial) {
        setLoading(false);
      }
    }
  };

  // Initial mount load with shimmer delay
  useEffect(() => {
    let isMounted = true;

    // Simulate standard initial fetch delay (~320ms matching TimelineScreen)
    const initialTimer = setTimeout(() => {
      if (isMounted) {
        fetchQueueData(true);
      }
    }, 320);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
    };
  }, []);

  // Entrance animation trigger: fires only once when actual data arrives
  useEffect(() => {
    if (!loading && currentEncounter && !hasAnimatedRef.current) {
      setIsInitialEntrance(true);
      hasAnimatedRef.current = true;

      // Reset entrance class after animation duration + max stagger delay
      const animationTimer = setTimeout(() => {
        setIsInitialEntrance(false);
      }, 750);

      return () => clearTimeout(animationTimer);
    }
  }, [loading, currentEncounter]);

  // Reactive listener: Storage events, focus events, and interval polling
  useEffect(() => {
    let isMounted = true;

    const handleBackgroundRefresh = () => {
      if (!isMounted) return;
      fetchQueueData(false);
    };

    const interval = setInterval(handleBackgroundRefresh, 2500);
    window.addEventListener('storage', handleBackgroundRefresh);
    window.addEventListener('focus', handleBackgroundRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleBackgroundRefresh);
      window.removeEventListener('focus', handleBackgroundRefresh);
    };
  }, [contextEncounter]);

  const handleFinishAndReturnHome = () => {
    clearEncounter();
    navigate('/');
  };

  // Calculate live queue metrics derived reliably from backend models
  const isCompleted = currentStep === 'CONSULTATION_COMPLETED';
  const isDoorCalled = currentStep === 'PLEASE_COME_IN';
  const isInConsultation = currentStep === 'CONSULTATION_STARTED';

  let patientsAhead = 0;
  if (isDoorCalled || isInConsultation || isCompleted) {
    patientsAhead = 0;
  } else if (currentEncounter?.patients_ahead !== undefined) {
    patientsAhead = currentEncounter.patients_ahead;
  } else if (currentEncounter?.queue_number > 1) {
    patientsAhead = currentEncounter.queue_number - 1;
  }

  const queueNumber = currentEncounter?.queue_number || (patientsAhead + 1);
  const isNext = patientsAhead === 0 && !isCompleted;
  const estimatedWait =
    currentEncounter?.estimated_wait ||
    (isNext ? '< 5 minutes' : `${patientsAhead * 5}–${(patientsAhead + 1) * 5} minutes`);
  const waitMessage =
    currentEncounter?.wait_message ||
    (isNext
      ? 'Please stay nearby. Dr. Mehta is about to call you.'
      : "Please stay nearby. We'll notify you when it's your turn.");

  // Helper for staggering entrance animations
  let cardCounter = 0;
  const getCardAnimation = () => {
    const index = cardCounter++;
    if (!isInitialEntrance) return {};
    return {
      className: 'waiting-card-entrance',
      style: { animationDelay: `${Math.min(index * 95, 480)}ms` },
    };
  };

  return (
    <div className="waiting-room-wrapper" style={{ padding: '8px 0' }}>
      {/* 1. Page Header: Kept 100% stable without entrance translation */}
      {loading && !currentEncounter ? (
        <div style={{ textAlign: 'center', marginBottom: 24 }} aria-busy="true">
          <Skeleton width={180} height={22} radius={20} style={{ margin: '0 auto 10px auto' }} />
          <Skeleton width={220} height={26} style={{ margin: '0 auto 8px auto' }} />
          <Skeleton width={260} height={14} style={{ margin: '0 auto' }} />
        </div>
      ) : currentEncounter ? (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--deep-indigo)',
              backgroundColor: 'var(--lavender-soft)',
              padding: '4px 14px',
              borderRadius: 20,
              border: '1px solid var(--lavender-200)',
              display: 'inline-block',
              marginBottom: 8,
              fontFamily: 'var(--font-mono)',
            }}
          >
            Encounter ID: {currentEncounter.id ? currentEncounter.id.slice(-6).toUpperCase() : 'ENC-LIVE'} •{' '}
            {currentEncounter.visit_type === 'REVISITING' ? 'REVISITING CONSULTATION' : 'NEW CONSULTATION'}
          </span>
          <h2 style={{ fontSize: '1.45rem', color: 'var(--main-text)', marginBottom: 4, fontWeight: 800 }}>
            {currentEncounter.doctor_name || 'Dr. Ramesh Mehta'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted-text)', margin: 0 }}>
            {currentEncounter.clinic_name || 'Mehta Community Clinic'} •{' '}
            {clinicStatus?.cabin || 'Cabin 2'}
          </p>
        </div>
      ) : null}

      {/* 2. Loading State: Skeletons matching exact Waiting layout with moving shimmer */}
      {loading ? (
        <div className="waiting-room-grid" aria-busy="true">
          <div>
            {/* Queue position skeleton */}
            <SkeletonCard
              style={{
                textAlign: 'center',
                padding: '24px 22px',
                marginBottom: 20,
                borderRadius: 16,
              }}
            >
              <Skeleton width={130} height={14} style={{ margin: '0 auto 10px auto' }} />
              <Skeleton width={110} height={52} radius={12} style={{ margin: '0 auto 12px auto' }} />
              <SkeletonBadge width={160} height={24} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <Skeleton width={190} height={14} style={{ margin: '0 auto 8px auto' }} />
              <Skeleton width={240} height={12} style={{ margin: '0 auto' }} />
            </SkeletonCard>

            {/* Status card skeleton */}
            <SkeletonCard style={{ textAlign: 'center', padding: 24, marginBottom: 20, borderRadius: 16 }}>
              <Skeleton width={64} height={64} circle style={{ margin: '0 auto 14px auto' }} />
              <Skeleton width={180} height={20} style={{ margin: '0 auto 8px auto' }} />
              <Skeleton width={280} height={14} style={{ margin: '0 auto' }} />
            </SkeletonCard>
          </div>

          <div>
            {/* Intake summary skeleton */}
            <SkeletonCard style={{ padding: 22, marginBottom: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Skeleton width={160} height={18} />
                <SkeletonBadge width={80} height={20} />
              </div>
              <Skeleton width="65%" height={20} style={{ marginBottom: 10 }} />
              <Skeleton width="45%" height={14} style={{ marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <SkeletonBadge width={90} height={24} />
                <SkeletonBadge width={80} height={24} />
              </div>
              <Skeleton height={50} radius={8} />
            </SkeletonCard>

            {/* Policy skeleton */}
            <SkeletonCard style={{ padding: 18, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Skeleton width={20} height={20} circle />
                <Skeleton width={140} height={16} />
              </div>
              <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="75%" height={14} />
            </SkeletonCard>
          </div>
        </div>
      ) : error ? (
        /* 3. Error State with Retry Button */
        <div
          className="fade-in page-centered-container"
          style={{ maxWidth: 560, textAlign: 'center', padding: '48px 20px' }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid #fecaca',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--main-text)', marginBottom: 8 }}>
            Unable to Load Queue Information
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', maxWidth: 420, margin: '0 auto 20px auto' }}>
            {error}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => fetchQueueData(true)}
          >
            <RefreshCw size={16} />
            Retry Connection
          </button>
        </div>
      ) : !currentEncounter ? (
        /* 4. Empty State: No Patient Waiting */
        <div
          className="fade-in page-centered-container"
          style={{ maxWidth: 580, textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--lavender-soft)',
              color: 'var(--deep-indigo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Clock size={32} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--main-text)', marginBottom: 8 }}>
            No Active Consultation
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--muted-text)',
              maxWidth: 420,
              margin: '0 auto 24px auto',
              lineHeight: 1.55,
            }}
          >
            You do not have an open encounter with Dr. Ramesh Mehta right now. You can check in or start an intake using
            your clinic QR code.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Return to Patient Portal
          </button>
        </div>
      ) : (
        /* 5. Data Available State: Animated Right-to-Left Queue Cards */
        <div className="waiting-room-grid">
          {/* Left Column: Live Queue Position & Consultation Status */}
          <div>
            {/* Card A: Dynamic Queue Position Card (Hidden when completed or called in) */}
            {!isCompleted && !isDoorCalled && (() => {
              const anim = getCardAnimation();
              return (
                <div className={anim.className} style={anim.style}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, var(--deep-indigo) 0%, #134E57 100%)',
                      borderRadius: 16,
                      padding: '20px 22px',
                      color: '#ffffff',
                      textAlign: 'center',
                      marginBottom: 20,
                      boxShadow: '0 8px 24px rgba(22, 98, 108, 0.22)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: '#BFE7EE',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 700,
                      }}
                    >
                      Current Queue Position
                    </span>
                    <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, margin: '6px 0' }}>
                      #{queueNumber}
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        padding: '4px 14px',
                        borderRadius: 20,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        marginBottom: 8,
                        color: isNext ? '#6ee7b7' : '#ffffff',
                      }}
                    >
                      <Users size={14} />
                      <span>{isNext ? "You're next" : `${patientsAhead} patient${patientsAhead > 1 ? 's' : ''} ahead of you`}</span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#E2F1F5' }}>
                      Estimated wait: <strong>{estimatedWait}</strong>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#BFE7EE', marginTop: 4, marginBottom: 0 }}>
                      {waitMessage}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Card B: Consultation Status Card */}
            {(() => {
              const anim = getCardAnimation();
              return (
                <div
                  className={`${anim.className || ''} ${statusUpdatedFeedback ? 'waiting-card-updated' : ''}`}
                  style={anim.style}
                >
                  {/* Status 1: WAITING */}
                  {currentStep === 'WAITING' && (
                    <div
                      className="v-card"
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        border: '2px solid var(--border-medium)',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        className="waiting-radar-icon"
                        style={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 14px auto',
                          borderRadius: '50%',
                          backgroundColor: 'var(--lavender-soft)',
                          color: 'var(--deep-indigo)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--lavender-200)',
                        }}
                      >
                        <Clock size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--main-text)', marginBottom: 6, fontWeight: 800 }}>
                        You're in the Queue
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', maxWidth: 360, margin: '0 auto' }}>
                        Your structured intake has been submitted. Dr. Mehta will open your chart shortly.
                      </p>
                    </div>
                  )}

                  {/* Status 2: DOCTOR REVIEWING */}
                  {currentStep === 'DOCTOR_REVIEWING' && (
                    <div
                      className="v-card"
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        border: '2px solid var(--secondary-lavender)',
                        backgroundColor: 'var(--lavender-soft)',
                        marginBottom: 20,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 14px auto',
                          borderRadius: '50%',
                          backgroundColor: 'var(--deep-indigo)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Eye size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--deep-indigo)', marginBottom: 6, fontWeight: 800 }}>
                        Dr. Mehta is reviewing your symptoms
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--main-text)', maxWidth: 360, margin: '0 auto' }}>
                        Doctor has opened your intake chart and is reviewing your chief complaint and symptoms. Please wait...
                      </p>
                    </div>
                  )}

                  {/* Status 3: CONSULTATION STARTED */}
                  {currentStep === 'CONSULTATION_STARTED' && (
                    <div
                      className="v-card"
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        border: '2px solid var(--status-normal-border)',
                        backgroundColor: 'var(--status-normal-bg)',
                        marginBottom: 20,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 14px auto',
                          borderRadius: '50%',
                          backgroundColor: 'var(--healthcare-teal)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Stethoscope size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--main-text)', marginBottom: 6, fontWeight: 800 }}>
                        Your consultation has started
                      </h3>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--status-normal-text)',
                          maxWidth: 360,
                          margin: '0 auto',
                          fontWeight: 600,
                        }}
                      >
                        Dr. Mehta is ready for you. Please proceed towards {clinicStatus?.cabin || 'Cabin 2'}.
                      </p>
                    </div>
                  )}

                  {/* Status 4: PLEASE COME IN */}
                  {currentStep === 'PLEASE_COME_IN' && (
                    <div
                      className="v-card waiting-door-card"
                      style={{
                        textAlign: 'center',
                        padding: '28px 20px',
                        border: '3px solid #059669',
                        backgroundColor: '#ecfdf5',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 76,
                          height: 76,
                          margin: '0 auto 14px auto',
                          borderRadius: '50%',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DoorOpen size={42} />
                      </div>
                      <span
                        style={{
                          backgroundColor: '#047857',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '4px 12px',
                          borderRadius: 20,
                          display: 'inline-block',
                          marginBottom: 8,
                        }}
                      >
                        🔔 IT'S YOUR TURN
                      </span>
                      <h2 style={{ fontSize: '1.6rem', color: '#064e3b', marginBottom: 6 }}>
                        It's your turn — please come in
                      </h2>
                      <p
                        style={{
                          fontSize: '0.94rem',
                          color: '#065f46',
                          fontWeight: 600,
                          maxWidth: 360,
                          margin: '0 auto',
                        }}
                      >
                        Dr. Mehta is ready to see you in {clinicStatus?.cabin || 'Cabin 2'}. Please enter now.
                      </p>
                    </div>
                  )}

                  {/* Status 5: CONSULTATION COMPLETED */}
                  {isCompleted && (
                    <div
                      className="v-card"
                      style={{
                        textAlign: 'center',
                        padding: 26,
                        border: '2px solid var(--slate-300)',
                        backgroundColor: '#ffffff',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 14px auto',
                          borderRadius: '50%',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={34} />
                      </div>

                      <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: 6 }}>
                        Consultation completed
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginBottom: 18 }}>
                        Your consultation with Dr. Mehta has ended. All notes and findings have been securely saved.
                      </p>

                      {/* Retention & Privacy Transparency Policy */}
                      <div
                        style={{
                          textAlign: 'left',
                          backgroundColor: 'var(--slate-50)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: '0.82rem',
                            color: '#059669',
                            fontWeight: 600,
                          }}
                        >
                          <FileCheck size={18} />
                          <span>Retained: Confirmed intake, transcript, and doctor consultation notes</span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: '0.82rem',
                            color: '#dc2626',
                            fontWeight: 600,
                          }}
                        >
                          <Trash2 size={18} />
                          <span>Deleted: Raw voice audio permanently deleted (Zero storage retained)</span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: '0.82rem',
                            color: 'var(--slate-600)',
                          }}
                        >
                          <ShieldCheck size={18} />
                          <span>Bounded Access Terminated: Doctor's query access to this encounter is now sealed</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-block btn-lg"
                          onClick={handleFinishAndReturnHome}
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Confirmed Intake & Bounded Access Information */}
          <div>
            {/* Card C: Confirmed Intake Summary Preview */}
            {currentEncounter.intake && (() => {
              const anim = getCardAnimation();
              const intake = currentEncounter.intake;
              return (
                <div className={anim.className} style={anim.style}>
                  <div className="v-card" style={{ padding: 18, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4
                        style={{
                          fontSize: '0.92rem',
                          color: 'var(--navy-900)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <FileCheck size={18} color="var(--teal-600)" />
                        Your Confirmed Intake for Today
                      </h4>
                      {intake.confidence && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--teal-700)',
                            backgroundColor: 'var(--teal-50)',
                            padding: '2px 8px',
                            borderRadius: 12,
                            border: '1px solid var(--teal-200)',
                          }}
                        >
                          {Math.round(intake.confidence * 100)}% Match
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.86rem', color: 'var(--slate-700)', lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block' }}>
                          CHIEF COMPLAINT
                        </span>
                        <strong style={{ color: 'var(--main-text)' }}>{intake.chief_complaint}</strong>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block' }}>
                          DURATION
                        </span>
                        <span>{intake.duration}</span>
                      </div>

                      {intake.symptoms && intake.symptoms.length > 0 && (
                        <div>
                          <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>
                            REPORTED SYMPTOMS
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {intake.symptoms.map((symptom, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.76rem',
                                  padding: '3px 10px',
                                  backgroundColor: 'var(--lavender-soft)',
                                  color: 'var(--deep-indigo)',
                                  borderRadius: 12,
                                  border: '1px solid var(--lavender-200)',
                                  fontWeight: 600,
                                }}
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Card D: Bounded Access Reminder Policy */}
            {!isCompleted && (() => {
              const anim = getCardAnimation();
              const isRevisiting = currentEncounter.visit_type === 'REVISITING';
              const hasAccess = isRevisiting && currentEncounter.doctor_access_granted;

              return (
                <div className={anim.className} style={anim.style}>
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      borderRadius: 14,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 16,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <ShieldCheck size={22} color="var(--teal-600)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong
                        style={{ fontSize: '0.84rem', color: 'var(--navy-900)', display: 'block', marginBottom: 2 }}
                      >
                        {isRevisiting ? 'Revisiting Consultation' : 'New Consultation'}
                      </strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.45 }}>
                        {hasAccess
                          ? 'Dr. Mehta has bounded access to your prior notes & published reports while this encounter is OPEN.'
                          : "Prior notes and past reports remain locked. Dr. Mehta only sees today's intake."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Card E: Clinic Guidelines & Support (Preserving layout balance) */}
            {!isCompleted && (() => {
              const anim = getCardAnimation();
              return (
                <div className={anim.className} style={anim.style}>
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--lavender-soft)',
                      borderRadius: 14,
                      border: '1px solid var(--lavender-200)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      fontSize: '0.8rem',
                      color: 'var(--deep-indigo)',
                    }}
                  >
                    <Building2 size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: 2 }}>Clinic Assistance</strong>
                      <span style={{ color: 'var(--slate-600)', fontSize: '0.78rem' }}>
                        Need help or feeling unwell while waiting? Speak with reception in the main hall.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
