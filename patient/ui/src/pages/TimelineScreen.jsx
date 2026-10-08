import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Stethoscope,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import { StatusBadge } from '../components/StatusBadge';

export function TimelineScreen() {
  const { patient } = usePatient();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const list = patientApi.getHealthTimeline(patient.id);
    setEvents(list);
  }, [patient]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'REPORT_PUBLISHED':
        return <FileText size={18} color="var(--teal-600)" />;
      case 'CONSULTATION_COMPLETED':
      case 'ENCOUNTER_CREATED':
        return <Stethoscope size={18} color="var(--blue-600)" />;
      case 'LAB_GRANT_APPROVED':
        return <Building2 size={18} color="#d97706" />;
      case 'SYMPTOMS_SUBMITTED':
      default:
        return <Clock size={18} color="var(--teal-600)" />;
    }
  };

  return (
    <div className="fade-in page-reading-container" style={{ maxWidth: 760, padding: '8px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: 4 }}>
          Patient Health Timeline
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)' }}>
          A simple chronological history of consultations, symptom submissions, and published laboratory reports.
        </p>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Continuous Vertical Timeline Line */}
        <div style={{
          position: 'absolute',
          left: 10,
          top: 8,
          bottom: 8,
          width: 2,
          backgroundColor: 'var(--border-subtle)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {events.map((event) => (
            <div key={event.id} style={{ position: 'relative' }}>
              {/* Timeline Marker Dot */}
              <div style={{
                position: 'absolute',
                left: -24,
                top: 4,
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '2px solid var(--teal-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--teal-600)' }} />
              </div>

              {/* Event Card */}
              <div className="v-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getEventIcon(event.type)}
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--navy-900)' }}>
                      {event.title}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--teal-800)', fontWeight: 600, marginBottom: 4 }}>
                  {event.subtitle}
                </div>

                {event.details && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.45 }}>
                    {event.details}
                  </p>
                )}

                {event.badge && (
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge status={event.badge} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
