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
    try {
      const data = await patientApi.getPublishedReports(patient.id);
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-500)' }}>
          <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid var(--teal-200)', borderTopColor: 'var(--teal-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontSize: '0.86rem' }}>Fetching published records...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="v-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <FileText size={38} color="var(--slate-300)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--navy-900)', marginBottom: 4 }}>No Published Reports</h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--slate-500)' }}>
            When an accredited lab publishes your CBC report, it appears here automatically.
          </p>
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="v-card"
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
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)' }}>{report.test_type}</h3>
                    <StatusBadge status={report.status} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--teal-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} />
                    {report.laboratory_name}
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
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
                        backgroundColor: 'var(--slate-50)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: 'var(--slate-600)' }}>{obs.test_name_normalized}:</span>
                      <strong style={{ color: 'var(--navy-900)' }}>{obs.value} {obs.unit}</strong>
                      <span className={`status-pill ${obs.flag.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {obs.flag}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} />
                  <span>Published {new Date(report.published_at || report.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ color: 'var(--teal-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>View Details</span>
                  <ChevronRight size={16} />
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
