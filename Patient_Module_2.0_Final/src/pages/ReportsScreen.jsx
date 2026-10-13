import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Download,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import { StatusBadge } from '../components/StatusBadge';
import { ReportCardSkeleton } from '../components/Skeleton';

export function ReportsScreen() {
  const navigate = useNavigate();
  const { patient } = usePatient();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, [patient]);

  const loadReports = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const data = await patientApi.getPublishedReports(patient.id);
      const elapsed = Date.now() - start;
      if (elapsed < 320) {
        await new Promise((resolve) => setTimeout(resolve, 320 - elapsed));
      }
      setReports(data);
    } catch (err) {
      console.warn('Failed loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.laboratory_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: 4 }}>
          My Diagnostic Reports
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)' }}>
          Published CBC blood reports owned by you. Available for yourself and authorized Revisiting doctors.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search
          size={18}
          color="var(--slate-400)"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Search by test or laboratory name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: 12,
            border: '1px solid var(--border-medium)',
            fontSize: '0.92rem',
            backgroundColor: '#ffffff',
          }}
        />
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="reports-grid">
          <ReportCardSkeleton count={3} />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="v-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <FileText size={38} color="var(--muted-text)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--main-text)', marginBottom: 4 }}>No Published Reports</h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted-text)' }}>
            When an accredited lab publishes your CBC report, it appears here automatically.
          </p>
        </div>
      ) : (
        <div className="reports-grid skeleton-content-fade">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="v-card v-card-clickable icon-shift-hover"
              onClick={() => navigate(`/report/${report._id}`)}
              style={{
                padding: '18px 18px',
                cursor: 'pointer',
                borderRadius: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--main-text)', fontWeight: 800 }}>{report.test_type}</h3>
                    <StatusBadge status={report.status} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--deep-indigo)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} color="var(--lavender)" />
                    {report.laboratory_name}
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)' }}>
                  {report.report_identifier}
                </span>
              </div>

              {/* Quick Observation Highlights */}
              {report.observations && report.observations.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  margin: '10px 0 14px 0',
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  {report.observations.slice(0, 3).map((obs, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.76rem',
                        backgroundColor: 'var(--lavender-soft)',
                        border: '1px solid var(--border-medium, #C0DCE4)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: 'var(--muted-text)' }}>{obs.test_name_normalized}:</span>
                      <strong style={{ color: 'var(--main-text)' }}>{obs.value} {obs.unit}</strong>
                      <span className={`status-pill ${obs.flag.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {obs.flag}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} color="var(--lavender)" />
                  <span>Published {new Date(report.published_at || report.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ color: 'var(--deep-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>View Details</span>
                  <ChevronRight size={16} className="chevron-icon" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bounded Access Reminder */}
      <div style={{
        marginTop: 24,
        padding: '12px 14px',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <ShieldCheck size={20} color="var(--teal-600)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', margin: 0 }}>
          <strong>Self-Owned Record:</strong> You have permanent access to all published reports. Laboratory access to your identity expired upon publication.
        </p>
      </div>
    </div>
  );
}
