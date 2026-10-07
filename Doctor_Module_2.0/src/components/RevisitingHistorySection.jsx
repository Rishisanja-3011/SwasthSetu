import React from 'react';
import { History, FileText, FlaskConical, Shield, Calendar, UserCheck } from 'lucide-react';

export const RevisitingHistorySection = ({ priorNotes = [], publishedReports = [], doctorName = 'Dr. Ramesh Mehta' }) => {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Revisiting Bounded Records (Unlocked by Patient)
          </h3>
          <span className="badge badge-revisiting">
            REVISITING ACCESS
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.76rem',
          color: '#059669',
          fontWeight: 600,
          backgroundColor: '#ecfdf5',
          padding: '4px 10px',
          borderRadius: 20,
          border: '1px solid #a7f3d0',
        }}>
          <Shield size={13} />
          <span>Patient Granted Bounded Historical Access</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* 1. Prior Consultation Notes (Author: THIS Doctor ONLY) */}
        <div className="v-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} color="var(--blue-600)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                Your Previous Consultation Notes
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              {priorNotes.length} note{priorNotes.length === 1 ? '' : 's'} found
            </span>
          </div>

          <div style={{
            fontSize: '0.76rem',
            color: 'var(--slate-500)',
            marginBottom: 12,
            backgroundColor: '#f8fafc',
            padding: '6px 10px',
            borderRadius: 6,
          }}>
            <UserCheck size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            Exclusively authored by {doctorName}. Notes by other doctors are strictly sealed.
          </div>

          {priorNotes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {priorNotes.map((note, idx) => (
                <div
                  key={note._id || idx}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--slate-500)',
                    marginBottom: 6,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {new Date(note.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--blue-700)',
                      backgroundColor: 'var(--blue-50)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                      DOCTOR_ENTERED
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--navy-900)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {note.notes_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.84rem' }}>
              No prior notes authored by you for this patient.
            </div>
          )}
        </div>

        {/* 2. All Published Diagnostic Reports */}
        <div className="v-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={18} color="var(--teal-600)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                Published Diagnostic Reports (All Labs)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              {publishedReports.length} report{publishedReports.length === 1 ? '' : 's'}
            </span>
          </div>

          <div style={{
            fontSize: '0.76rem',
            color: 'var(--slate-500)',
            marginBottom: 12,
            backgroundColor: '#f8fafc',
            padding: '6px 10px',
            borderRadius: 6,
          }}>
            Cross-laboratory diagnostic visibility permitted under REVISITING consultation.
          </div>

          {publishedReports.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {publishedReports.map((rep, idx) => (
                <div
                  key={rep.id || rep._id || idx}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--slate-200)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                        {rep.test_type || 'Complete Blood Count (CBC)'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--slate-500)' }}>
                        {rep.laboratory_name} ({rep.laboratory_code || 'LAB-808'}) • {rep.published_at ? new Date(rep.published_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      border: '1px solid #a7f3d0',
                    }}>
                      PUBLISHED
                    </span>
                  </div>

                  {/* Observations Table Preview */}
                  {rep.observations && rep.observations.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: '1px solid var(--slate-100)', paddingTop: 8 }}>
                      <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ color: 'var(--slate-400)', textAlign: 'left', borderBottom: '1px solid var(--slate-100)' }}>
                            <th style={{ paddingBottom: 4 }}>Parameter</th>
                            <th style={{ paddingBottom: 4 }}>Value</th>
                            <th style={{ paddingBottom: 4 }}>Ref Range</th>
                            <th style={{ paddingBottom: 4 }}>Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rep.observations.slice(0, 5).map((obs, oIdx) => (
                            <tr key={oIdx} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '4px 0', fontWeight: 600, color: 'var(--slate-700)' }}>
                                {obs.test_name_normalized || obs.test_name_original}
                              </td>
                              <td style={{ padding: '4px 0', fontWeight: 700, color: obs.flag === 'LOW' ? '#1d4ed8' : (obs.flag === 'HIGH' ? '#dc2626' : '#059669') }}>
                                {obs.value} {obs.unit}
                              </td>
                              <td style={{ padding: '4px 0', color: 'var(--slate-500)' }}>
                                {obs.reference_low} - {obs.reference_high} {obs.unit}
                              </td>
                              <td style={{ padding: '4px 0' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  backgroundColor: obs.flag === 'LOW' ? '#eff6ff' : (obs.flag === 'HIGH' ? '#fef2f2' : '#ecfdf5'),
                                  color: obs.flag === 'LOW' ? '#1d4ed8' : (obs.flag === 'HIGH' ? '#dc2626' : '#059669'),
                                }}>
                                  {obs.flag}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.84rem' }}>
              No published reports found for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
