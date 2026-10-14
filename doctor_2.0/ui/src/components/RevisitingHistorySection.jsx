import React from 'react';
import { History, FileText, FlaskConical, Shield, Calendar, UserCheck, ShieldCheck } from 'lucide-react';

const EMPTY_VALUE = '— Not available yet —';

function valueOrBlank(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : EMPTY_VALUE;
  return value === undefined || value === null || String(value).trim() === '' ? EMPTY_VALUE : value;
}

function IntakeField({ label, value }) {
  const shown = valueOrBlank(value);
  return (
    <div>
      <div
        style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          color: 'var(--muted-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.84rem',
          fontWeight: 650,
          color: shown === EMPTY_VALUE ? 'var(--subtle-text)' : 'var(--main-text)',
        }}
      >
        {shown}
      </div>
    </div>
  );
}

export const RevisitingHistorySection = ({
  priorNotes = [],
  priorIntakes = [],
  publishedReports = [],
  doctorName = 'Dr. Ramesh Mehta',
}) => {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--main-text)', margin: 0 }}>
            Revisiting Bounded Records
          </h3>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--lavender-soft)',
              color: 'var(--deep-indigo)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--neo-raised-sm)',
            }}
          >
            Unlocked by Patient
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.76rem',
            color: 'var(--deep-indigo)',
            fontWeight: 700,
            backgroundColor: 'var(--surface-raised)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--neo-raised-sm)',
          }}
        >
          <ShieldCheck size={14} color="var(--hospital-blue)" />
          <span>Patient Granted Bounded Historical Access</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* 1. Prior Consultation Notes */}
        <div className="v-card" style={{ padding: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} color="var(--hospital-blue)" />
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--main-text)' }}>
                Your Previous Consultation Notes
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted-text)', fontWeight: 600 }}>
              {priorNotes.length} note{priorNotes.length === 1 ? '' : 's'}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--muted-text)',
              marginBottom: 14,
              backgroundColor: 'var(--surface-inset)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--neo-inset-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <UserCheck size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: -2 }} />
            Exclusively authored by {doctorName}. Notes by other doctors remain strictly sealed.
          </div>

          {priorNotes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {priorNotes.map((note, idx) => (
                <div
                  key={note._id || idx}
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-inset)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--neo-inset-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      color: 'var(--muted-text)',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Calendar size={13} />
                      {new Date(note.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--deep-indigo)',
                        backgroundColor: 'var(--lavender-soft)',
                        padding: '2px 7px',
                        borderRadius: 6,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      DOCTOR_ENTERED
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--main-text)', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
                    {note.notes_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--muted-text)', fontSize: '0.86rem' }}>
              No prior notes authored by you for this patient.
            </div>
          )}
        </div>

        {/* 2. All Published Diagnostic Reports */}
        <div className="v-card" style={{ padding: 22 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={18} color="var(--deep-indigo)" />
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--main-text)' }}>
                Published Diagnostic Reports
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted-text)', fontWeight: 600 }}>
              {publishedReports.length} report{publishedReports.length === 1 ? '' : 's'}
            </span>
          </div>

          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--muted-text)',
              marginBottom: 14,
              backgroundColor: 'var(--surface-inset)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--neo-inset-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Cross-laboratory diagnostic visibility permitted under REVISITING consultation scope.
          </div>

          {publishedReports.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {publishedReports.map((rep, idx) => (
                <div
                  key={rep.id || rep._id || idx}
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-inset)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--neo-inset-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--main-text)' }}>
                        {rep.test_type || 'Complete Blood Count (CBC)'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted-text)', marginTop: 2 }}>
                        {rep.laboratory_name || 'Laboratory'} ({rep.laboratory_code || 'LAB'}) • {rep.published_at ? new Date(rep.published_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'var(--status-normal-bg)',
                        color: 'var(--status-normal-text)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--status-normal-border)',
                        boxShadow: 'var(--neo-raised-sm)',
                      }}
                    >
                      PUBLISHED
                    </span>
                  </div>

                  {/* Observations Table Preview */}
                  {rep.observations && rep.observations.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8, overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: 'var(--muted-text)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ paddingBottom: 6, fontWeight: 700 }}>Parameter</th>
                            <th style={{ paddingBottom: 6, fontWeight: 700 }}>Value</th>
                            <th style={{ paddingBottom: 6, fontWeight: 700 }}>Ref Range</th>
                            <th style={{ paddingBottom: 6, fontWeight: 700 }}>Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rep.observations.slice(0, 5).map((obs, oIdx) => {
                            const isLow = obs.flag === 'LOW';
                            const isHigh = obs.flag === 'HIGH';
                            return (
                              <tr key={oIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                                <td style={{ padding: '6px 0', fontWeight: 650, color: 'var(--main-text)' }}>
                                  {obs.test_name_normalized || obs.test_name_original}
                                </td>
                                <td style={{ padding: '6px 0', fontWeight: 700, color: isLow ? 'var(--deep-indigo)' : (isHigh ? 'var(--status-danger-text)' : '#0D9488') }}>
                                  {obs.value} {obs.unit}
                                </td>
                                <td style={{ padding: '6px 0', color: 'var(--muted-text)' }}>
                                  {obs.reference_low} - {obs.reference_high} {obs.unit}
                                </td>
                                <td style={{ padding: '6px 0' }}>
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      backgroundColor: isLow ? 'var(--lavender-soft)' : (isHigh ? 'var(--status-danger-bg)' : 'var(--status-normal-bg)'),
                                      color: isLow ? 'var(--deep-indigo)' : (isHigh ? 'var(--status-danger-text)' : 'var(--status-normal-text)'),
                                    }}
                                  >
                                    {obs.flag || 'NORMAL'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--muted-text)', fontSize: '0.86rem' }}>
              No published reports found for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
