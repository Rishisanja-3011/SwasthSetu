import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  FileText,
  Stethoscope,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import { StatusBadge } from '../components/StatusBadge';
import { TimelineSkeleton } from '../components/Skeleton';
import { ConsultationDetailModal } from '../components/ConsultationDetailModal';
import './TimelineScreen.css';

export function TimelineScreen() {
  const { patient } = usePatient();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Single reliable source of truth for modal visibility & selected encounter
  const selectedEncounterId = searchParams.get('encounterId');
  const isModalOpen = Boolean(selectedEncounterId);

  // Load timeline events
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchTimeline = async () => {
      try {
        const list = await patientApi.getHealthTimeline(patient?.id, patient?.patient_identifier);
        if (isMounted) {
          setEvents(list || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load health timeline:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, [patient]);

  const handleCardClick = (event) => {
    const encId =
      event.encounterId ||
      (typeof event.id === 'string' && event.id.startsWith('t-enc-')
        ? event.id.replace('t-enc-', '')
        : typeof event.id === 'string' && event.id.startsWith('t-comp-')
        ? event.id.replace('t-comp-', '')
        : null);

    if (encId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('encounterId', encId);
        return next;
      });
    }
  };

  const handleCloseModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('encounterId');
      return next;
    }, { replace: true });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'REPORT_PUBLISHED':
        return <FileText size={18} color="var(--deep-indigo)" />;
      case 'CONSULTATION_COMPLETED':
      case 'ENCOUNTER_CREATED':
        return <Stethoscope size={18} color="var(--lavender)" />;
      case 'LAB_GRANT_APPROVED':
        return <Building2 size={18} color="var(--healthcare-teal)" />;
      case 'SYMPTOMS_SUBMITTED':
      default:
        return <Clock size={18} color="var(--deep-indigo)" />;
    }
  };

  return (
    <>
      <div className="skeleton-content-fade page-reading-container" style={{ maxWidth: 760, padding: '8px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--main-text)', marginBottom: 4, fontWeight: 800 }}>
          Patient Health Timeline
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--muted-text)' }}>
          A simple chronological history of consultations, symptom submissions, and published laboratory reports. Click any consultation card to view complete doctor notes, original symptoms, and prescriptions.
        </p>
      </div>

      <div className="timeline-content-wrapper">
        {/* Continuous Vertical Timeline Line */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 8,
            bottom: 8,
            width: 2,
            backgroundColor: 'var(--border-medium, #C0DCE4)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <TimelineSkeleton count={3} />
          ) : events.length === 0 ? (
            <div className="v-card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Clock size={36} color="var(--muted-text)" style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--main-text)', fontWeight: 700 }}>
                No timeline entries recorded yet.
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--muted-text)' }}>
                Consultations and reports will appear here in chronological order.
              </p>
            </div>
          ) : (
            events.map((event, idx) => {
              const staggerDelay = `${Math.min(idx * 75, 520)}ms`;
              const encId =
                event.encounterId ||
                (typeof event.id === 'string' && event.id.startsWith('t-enc-')
                  ? event.id.replace('t-enc-', '')
                  : typeof event.id === 'string' && event.id.startsWith('t-comp-')
                  ? event.id.replace('t-comp-', '')
                  : null);
              const isClickable = Boolean(encId);

              return (
                <div key={event.id || idx} style={{ position: 'relative' }}>
                  {/* Timeline Marker Dot */}
                  <div
                    className="timeline-marker-animate"
                    style={{
                      position: 'absolute',
                      left: -24,
                      top: 14,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      border: '2px solid var(--hospital-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(34, 146, 160, 0.2)',
                      transition: 'transform 0.18s ease',
                      animationDelay: staggerDelay,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isClickable ? 'var(--deep-indigo)' : 'var(--muted-text)',
                      }}
                    />
                  </div>

                  {/* Event Card with Right-to-Left Entrance Animation */}
                  <div
                    className="timeline-card-entrance"
                    style={{
                      animationDelay: staggerDelay,
                    }}
                  >
                    <div
                      className={`v-card ${isClickable ? 'v-card-clickable icon-shift-hover' : ''}`}
                      onClick={() => isClickable && handleCardClick(event)}
                      role={isClickable ? 'button' : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleCardClick(event);
                        }
                      }}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 14,
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {getEventIcon(event.type)}
                          <h4 style={{ fontSize: '0.98rem', color: 'var(--main-text)', fontWeight: 800, margin: 0 }}>
                            {event.title}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--muted-text)',
                              fontFamily: 'var(--font-mono)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {new Date(event.timestamp).toLocaleDateString()}
                          </span>
                          {isClickable && (
                            <ChevronRight
                              size={15}
                              color="var(--hospital-blue)"
                              className="icon-shift-hover"
                              style={{ flexShrink: 0 }}
                            />
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--deep-indigo)',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {event.subtitle}
                      </div>

                      {event.details && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--muted-text)', margin: 0, lineHeight: 1.45 }}>
                          {event.details}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 8,
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        {event.badge ? (
                          <StatusBadge status={event.badge} />
                        ) : (
                          <div />
                        )}

                        {isClickable && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--hospital-blue)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            View Consultation Details &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>

      {/* Complete Consultation Detail Modal */}
      {isModalOpen && selectedEncounterId && (
        <ConsultationDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          encounterId={selectedEncounterId}
          patientIdentifier={patient?.patient_identifier}
        />
      )}
    </>
  );
}
