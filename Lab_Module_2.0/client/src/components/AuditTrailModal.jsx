import React, { useState, useEffect } from 'react';
import { FileText, X, ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose, resourceId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && resourceId) {
      setLoading(true);
      fetch(`/api/lab/audit-events/${resourceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEvents(data.events);
          }
        })
        .catch((err) => console.error('Failed to load audit events:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, resourceId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <FileText size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Immutable Security Audit Trail</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Verifiable logs of actor, action, timestamp, and bounded access state
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading audit events...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No audit records found for this resource.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.map((evt) => {
                const isExpiredAction = evt.action.includes('EXPIRE');
                return (
                  <div
                    key={evt._id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: isExpiredAction ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-subtle)',
                      padding: '0.9rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="badge"
                          style={{
                            background: evt.actor_type === 'SYSTEM' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                            color: evt.actor_type === 'SYSTEM' ? '#c084fc' : '#38bdf8',
                          }}
                        >
                          {evt.actor_type}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          {evt.action}
                        </strong>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: evt.outcome === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.2)',
                          color: evt.outcome === 'SUCCESS' ? '#34d399' : '#c084fc',
                        }}
                      >
                        {evt.outcome}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Resource: {evt.resource_type} ({evt.resource_id.slice(-6)})</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()} · {new Date(evt.timestamp).toLocaleDateString()}</span>
                    </div>

                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          background: '#090d16',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#94a3b8',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {JSON.stringify(evt.details, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
