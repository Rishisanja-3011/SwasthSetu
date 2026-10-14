import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  RefreshCw,
  Clock,
  ChevronRight,
  Stethoscope,
  Search,
  FileText,
  DoorOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { AnimatedCounter } from '../components/AnimatedCounter';

export const DoctorQueueScreen = () => {
  const { doctor, queue, refreshQueue, isQueueLoaded } = useDoctorAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshQueue();
    setTimeout(() => setRefreshing(false), 350);
  };

  const handleSelectPatient = (encounterId) => {
    navigate(`/cockpit/${encounterId}`);
  };

  // Filter queue by search query and status filter
  const filteredQueue = useMemo(() => {
    return (queue || []).filter((item) => {
      const name = item.patient_name || '';
      const pid = item.patient_identifier || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pid.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'WAITING') return item.lifecycle_state === 'WAITING' || item.status === 'WAITING';
      if (statusFilter === 'REVIEW') return item.lifecycle_state === 'DOCTOR_REVIEWING';
      if (statusFilter === 'CONSULTATION') {
        return (
          item.lifecycle_state === 'PLEASE_COME_IN' ||
          item.lifecycle_state === 'CONSULTATION_STARTED' ||
          item.status === 'IN_CONSULTATION'
        );
      }
      return true;
    });
  }, [queue, searchQuery, statusFilter]);

  // Compute live queue statistics
  const stats = useMemo(() => {
    const list = queue || [];
    const waitingCount = list.filter(
      (p) => (!p.lifecycle_state || p.lifecycle_state === 'WAITING') && p.status !== 'IN_CONSULTATION'
    ).length;
    const reviewingCount = list.filter((p) => p.lifecycle_state === 'DOCTOR_REVIEWING').length;
    const inConsultCount = list.filter(
      (p) =>
        p.lifecycle_state === 'PLEASE_COME_IN' ||
        p.lifecycle_state === 'CONSULTATION_STARTED' ||
        p.status === 'IN_CONSULTATION'
    ).length;
    return {
      waiting: waitingCount,
      reviewing: reviewingCount,
      inConsult: inConsultCount,
      totalQueue: list.length,
    };
  }, [queue]);

  return (
    <div className="fade-in">
      {/* Top Header Banner with Doctor Station Info */}
      <div
        className="v-card"
        style={{
          marginBottom: 24,
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #32B3C2 0%, #2292A0 50%, #1A7986 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--neo-btn-primary)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              flexShrink: 0,
            }}
          >
            <Stethoscope size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--main-text)', margin: 0 }}>
                {doctor?.name || 'Dr. Ramesh Mehta'}
              </h1>
              <span
                style={{
                  backgroundColor: 'var(--status-normal-bg)',
                  color: 'var(--status-normal-text)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--neo-raised-sm)',
                }}
              >
                Cabin 2 • Active Station
              </span>
              <span
                style={{
                  backgroundColor: 'var(--surface-inset)',
                  color: 'var(--hospital-blue)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: 'var(--neo-inset-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {doctor?.doctor_code || doctor?.qr_code_id || 'DOC-409'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted-text)', margin: '4px 0 0 0' }}>
              {doctor?.specialty || 'General Physician'} • {doctor?.clinic_name || 'Mehta Community Health Clinic'} • Real-Time Queue
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleManualRefresh}
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
            disabled={refreshing}
            title="Refresh active queue"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Queue'}</span>
          </button>
        </div>
      </div>

      {/* Doctor Stats Grid (Neomorphic Raised Stat Cards) */}
      <div className="doctor-stats-grid">
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'var(--status-waiting-bg)', color: 'var(--status-waiting-text)' }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-card-val">
              <AnimatedCounter value={isQueueLoaded ? stats.waiting : undefined} />
            </div>
            <div className="stat-card-lbl">Waiting in Queue</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'var(--lavender-soft)', color: 'var(--deep-indigo)' }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div className="stat-card-val">
              <AnimatedCounter value={isQueueLoaded ? stats.reviewing : undefined} />
            </div>
            <div className="stat-card-lbl">Under Review</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'var(--status-normal-bg)', color: 'var(--status-normal-text)' }}
          >
            <DoorOpen size={20} />
          </div>
          <div>
            <div className="stat-card-val">
              <AnimatedCounter value={isQueueLoaded ? stats.inConsult : undefined} />
            </div>
            <div className="stat-card-lbl">In Consultation</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ backgroundColor: 'var(--bg-light-blue)', color: 'var(--hospital-blue)' }}
          >
            <Users size={20} />
          </div>
          <div>
            <div className="stat-card-val">
              <AnimatedCounter value={isQueueLoaded ? stats.totalQueue : undefined} />
            </div>
            <div className="stat-card-lbl">Total Patient Queue</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div
        className="v-card"
        style={{
          marginBottom: 16,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Search Well */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-text)',
            }}
          />
          <input
            type="text"
            placeholder="Search patient name, token or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              fontSize: '0.86rem',
            }}
          />
        </div>

        {/* Status Filters Pill Row */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            backgroundColor: 'var(--surface-inset)',
            padding: '3px 5px',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--neo-inset-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {['ALL', 'WAITING', 'REVIEW', 'CONSULTATION'].map((tab) => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--white)' : 'transparent',
                  color: isActive ? 'var(--hospital-blue)' : 'var(--muted-text)',
                  boxShadow: isActive ? 'var(--neo-raised-sm)' : 'none',
                  transition: 'all 0.16s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="v-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-inset)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--lavender-soft)',
                color: 'var(--hospital-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--neo-raised-sm)',
              }}
            >
              <Users size={17} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--main-text)', margin: 0 }}>
              Waiting Patients ({filteredQueue.length})
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', fontWeight: 600 }}>
            Strict arrival time order • Bounded encounter scope
          </span>
        </div>

        {filteredQueue.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--muted-text)',
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'rgba(235, 245, 248, 0.4)',
                  }}
                >
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Token #</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Patient Identity</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Visit Type</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Dual Clinical Intake</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Clinical Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isCalling =
                    item.lifecycle_state === 'PLEASE_COME_IN' ||
                    item.lifecycle_state === 'CONSULTATION_STARTED' ||
                    item.status === 'IN_CONSULTATION';
                  const isReviewing = item.lifecycle_state === 'DOCTOR_REVIEWING';

                  return (
                    <tr
                      key={item.encounter_id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isCalling
                          ? 'rgba(230, 247, 242, 0.45)'
                          : isReviewing
                          ? 'rgba(235, 245, 248, 0.55)'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Token # */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isCalling
                                ? 'var(--hospital-blue)'
                                : isFirst
                                ? 'var(--deep-indigo)'
                                : 'var(--surface-inset)',
                              color: isCalling || isFirst ? '#ffffff' : 'var(--deep-indigo)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              boxShadow: 'var(--neo-raised-sm)',
                            }}
                          >
                            {item.queue_number || idx + 1}
                          </span>
                          {isFirst && (
                            <span
                              style={{
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                backgroundColor: 'var(--hospital-blue)',
                                color: '#ffffff',
                                padding: '2px 7px',
                                borderRadius: 6,
                                letterSpacing: '0.04em',
                              }}
                            >
                              NEXT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient Identity */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--main-text)' }}>
                          {item.patient_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted-text)', marginTop: 2 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {item.patient_identifier}
                          </span>
                          {item.age ? ` • ${item.age}y` : ''} {item.gender || ''}
                        </div>
                      </td>

                      {/* Visit Type */}
                      <td style={{ padding: '16px 20px' }}>
                        <StatusBadge type={item.visit_type} />
                      </td>

                      {/* Dual Clinical Intake */}
                      <td style={{ padding: '16px 20px', maxWidth: 420 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--main-text)' }}>
                          {item.chief_complaint || 'General medical follow-up'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          {item.duration && (
                            <span style={{ fontSize: '0.76rem', color: 'var(--muted-text)' }}>
                              Duration: <strong style={{ color: 'var(--main-text)' }}>{item.duration}</strong>
                            </span>
                          )}
                          {item.symptoms && item.symptoms.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {item.symptoms.slice(0, 3).map((sym, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--deep-indigo)',
                                    backgroundColor: 'var(--lavender-soft)',
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    border: '1px solid var(--border-subtle)',
                                    fontWeight: 600,
                                  }}
                                >
                                  {sym}
                                </span>
                              ))}
                              {item.symptoms.length > 3 && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--muted-text)',
                                    padding: '2px 4px',
                                  }}
                                >
                                  +{item.symptoms.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <StatusBadge type={item.lifecycle_state || item.status} />
                      </td>

                      {/* Action CTA */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleSelectPatient(item.encounter_id)}
                          className={isCalling ? 'btn btn-teal' : 'btn btn-hospital-blue'}
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.84rem',
                          }}
                        >
                          <Eye size={15} />
                          <span>{isCalling ? 'Active Consultation' : 'Review Symptoms'}</span>
                          <ChevronRight size={14} className="icon-shift-hover" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Queue State */
          <div style={{ padding: '54px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'var(--surface-inset)',
                color: 'var(--muted-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: 'var(--neo-inset-sm)',
              }}
            >
              <Users size={30} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--main-text)', marginBottom: 6 }}>
              No Patients Currently in Queue
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted-text)', maxWidth: 440, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              Your queue is clear. When patients arrive at clinic and scan your doctor QR standee ({doctor?.doctor_code || 'DOC-409'}), they will appear here automatically in real time.
            </p>
            <button
              onClick={() => navigate('/qr')}
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem' }}
            >
              <span>View Clinic QR Standee</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
