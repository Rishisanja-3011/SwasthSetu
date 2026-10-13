import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  Building2,
  FileText,
  ChevronRight,
  AlertCircle,
  Activity,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';
import { QRScannerModal } from '../components/QRScannerModal';
import { LabPermissionModal } from '../components/LabPermissionModal';
import { StatusBadge } from '../components/StatusBadge';
import FloatingMediBot from '../components/FloatingMediBot';
import {
  PatientHeaderSkeleton,
  ReportCardSkeleton,
  HomeActionCardSkeleton,
  HomeTipCardSkeleton,
} from '../components/Skeleton';

export function HomeScreen() {
  const navigate = useNavigate();
  const { patient, activeEncounter } = usePatient();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedLabEntity, setSelectedLabEntity] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [reports, setReports] = useState([]);
  const [labGrants, setLabGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualError, setManualError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, [patient]);

  const loadHomeData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const [reps, grants] = await Promise.all([
        patientApi.getPublishedReports(patient.id),
        patientApi.getLabGrants(),
      ]);
      // Minimum visual threshold (320ms) to ensure smooth shimmer sweep without flickering
      const elapsed = Date.now() - start;
      if (elapsed < 320) {
        await new Promise((resolve) => setTimeout(resolve, 320 - elapsed));
      }
      setReports(reps.slice(0, 3));
      setLabGrants(grants);
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeResolved = (resolved) => {
    if (resolved.type === 'DOCTOR') {
      navigate('/doctor-confirm', { state: { doctor: resolved.entity } });
    } else if (resolved.type === 'LABORATORY') {
      setSelectedLabEntity(resolved.entity);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim() || isSubmitting) return;
    setManualError(null);
    setIsSubmitting(true);
    try {
      const resolved = await patientApi.resolveCode(manualCode.trim());
      handleCodeResolved(resolved);
    } catch (err) {
      setManualError(err.message || 'Invalid code. Please enter DOC-409.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabGrantSuccess = () => {
    setLabGrants(patientApi.getLabGrants());
    navigate('/reports');
  };

  const activeGrant = labGrants.find((g) => g.status === 'ACTIVE');

  return (
    <div className="fade-in">
      {/* Patient Welcome Hero Card - Lavender Medical SaaS */}
      {loading ? (
        <PatientHeaderSkeleton />
      ) : (
        <div className="skeleton-content-fade" style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, var(--lavender-soft) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 26px',
          border: '1.5px solid var(--lavender-300)',
          marginBottom: 24,
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            right: -30,
            bottom: -30,
            width: 160,
            height: 160,
            background: 'radial-gradient(circle, rgba(147, 148, 249, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                backgroundColor: '#FFFFFF',
                color: 'var(--deep-indigo)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--lavender-200)',
                fontFamily: 'var(--font-mono)',
              }}>
                ID: {patient.patient_identifier}
              </span>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                backgroundColor: 'var(--status-normal-bg)',
                color: 'var(--status-normal-text)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--status-normal-border)',
              }}>
                ● Self-Owned Health Record
              </span>
            </div>

            {activeEncounter && activeEncounter.status !== 'CLOSED' && (
              <button
                onClick={() => navigate('/waiting')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'var(--lavender-soft)',
                  color: 'var(--deep-indigo)',
                  border: '1px solid var(--lavender)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Activity size={14} />
                <span>Active Visit: Queue #{activeEncounter.queue_number}</span>
              </button>
            )}
          </div>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--main-text)', marginBottom: 6, fontWeight: 800 }}>
            Namaste, {patient.name.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--muted-text)', maxWidth: 660, lineHeight: 1.55 }}>
            Welcome to your personal healthcare portal. Connect with your visiting doctor, review past diagnostic blood tests, or describe new symptoms.
          </p>
        </div>
      )}

      {/* Main Home Responsive Grid */}
      <div className="home-content-grid">
        {/* Column 1: Clinic / Lab Access & QR Scanner */}
        <div>
          {loading ? (
            <HomeActionCardSkeleton />
          ) : (
            <div className="skeleton-content-fade">
              {/* Active Lab Grant Card (If patient granted access to lab) */}
              {activeGrant && (
                <div style={{
                  backgroundColor: 'var(--status-normal-bg)',
                  border: '1.5px solid var(--status-normal-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 18px',
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-normal-text)',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)',
                  }}>
                    <Building2 size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="status-pill active" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        Lab Check-in Active
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--status-normal-text)', fontFamily: 'var(--font-mono)' }}>
                        {activeGrant.laboratory_code}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--main-text)', marginTop: 2 }}>
                      {activeGrant.laboratory_name}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted-text)', margin: 0, marginTop: 2 }}>
                      Specimen analysis in progress. Lab access expires immediately upon report publication.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Action Card: SCAN QR */}
              <div className="v-card" style={{
                padding: '26px 22px',
                textAlign: 'center',
                marginBottom: 24,
              }}>
                <div style={{
                  width: 76,
                  height: 76,
                  margin: '0 auto 18px auto',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--lavender-soft) 0%, var(--lavender-subtle) 100%)',
                  border: '1.5px solid var(--lavender-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--deep-indigo)',
                  boxShadow: 'var(--shadow-glow)',
                }}>
                  <QrCode size={40} />
                </div>

                <h3 style={{ fontSize: '1.25rem', color: 'var(--main-text)', marginBottom: 6 }}>
                  Visiting a Clinic or Diagnostic Center?
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px auto' }}>
                  Scan the QR code displayed at the doctor's reception desk or pathology center to initiate your consultation.
                </p>

                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={() => setIsScannerOpen(true)}
                  style={{ marginBottom: 18 }}
                >
                  <QrCode size={20} />
                  <span>Scan Reception QR</span>
                </button>

                {/* Fallback Manual Code Entry */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 16,
                  marginTop: 6,
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', display: 'block', marginBottom: 10 }}>
                    or enter Clinic / Lab code manually:
                  </span>

                  <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. DOC-409 or LAB-808"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '11px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-medium)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.92rem',
                        textTransform: 'uppercase',
                        outlineColor: 'var(--lavender)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !manualCode.trim()}
                      className="btn btn-secondary"
                      style={{ padding: '11px 20px', opacity: isSubmitting || !manualCode.trim() ? 0.7 : 1 }}
                    >
                      {isSubmitting ? <RefreshCw size={15} className="spin" /> : 'Continue'}
                    </button>
                  </form>

                  {manualError && (
                    <div style={{
                      marginTop: 10,
                      fontSize: '0.8rem',
                      color: 'var(--status-danger-text)',
                      backgroundColor: 'var(--status-danger-bg)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--status-danger-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'center',
                    }}>
                      <AlertCircle size={14} />
                      <span>{manualError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Published Diagnostic Reports Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--main-text)' }}>My Published Reports</h3>
            <button
              onClick={() => navigate('/reports')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--deep-indigo)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'opacity 0.15s ease',
              }}
            >
              <span>View All ({reports.length})</span>
              <ChevronRight size={14} className="icon-shift-hover" />
            </button>
          </div>

          {loading ? (
            <>
              <ReportCardSkeleton count={2} />
              <HomeTipCardSkeleton />
            </>
          ) : (
            <div className="skeleton-content-fade">
              {reports.length === 0 ? (
                <div className="v-card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted-text)' }}>
                  <FileText size={38} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <h4 style={{ fontSize: '0.98rem', color: 'var(--main-text)', marginBottom: 4 }}>No Published Reports Yet</h4>
                  <p style={{ fontSize: '0.84rem' }}>When an accredited lab publishes your CBC report, it appears here automatically.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reports.map((rep) => (
                    <div
                      key={rep._id}
                      className="v-card v-card-clickable"
                      onClick={() => navigate(`/report/${rep._id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--lavender-soft)',
                          color: 'var(--deep-indigo)',
                          border: '1px solid var(--lavender-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <FileText size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '0.96rem', color: 'var(--main-text)' }}>{rep.test_type}</strong>
                            <StatusBadge status={rep.status} />
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)', marginTop: 2 }}>
                            {rep.laboratory_name} • {new Date(rep.published_at || rep.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="icon-shift-hover" color="var(--muted-text)" />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Info Tip Card */}
              <div style={{
                marginTop: 18,
                padding: '16px 18px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--lavender-soft)',
                  color: 'var(--deep-indigo)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--main-text)', marginBottom: 2 }}>
                    Patient-Owned Health Data
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-text)', margin: 0, lineHeight: 1.5 }}>
                    Your clinical records and reports are stored under your personal control. Visiting doctors only receive temporary access with your explicit permission during an active encounter.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeResolved={handleCodeResolved}
      />

      <LabPermissionModal
        isOpen={!!selectedLabEntity}
        labEntity={selectedLabEntity}
        onClose={() => setSelectedLabEntity(null)}
        onSuccess={handleLabGrantSuccess}
      />

      <FloatingMediBot />
    </div>
  );
}
