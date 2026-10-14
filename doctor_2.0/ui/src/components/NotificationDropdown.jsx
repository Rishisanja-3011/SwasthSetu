import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, History, Sparkles, ChevronRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDoctorAuth } from '../context/DoctorAuthContext';

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useDoctorAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectNotification = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif._id);
    }
    onClose();
    if (notif.encounter_id) {
      navigate(`/cockpit/${notif.encounter_id}`);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="profile-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(22, 45, 53, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          display: 'none',
        }}
      />

      <div
        ref={dropdownRef}
        className="fade-in profile-dropdown-container"
        style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: 400,
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--neo-raised-lg)',
          zIndex: 999,
          padding: '20px 22px',
          color: 'var(--main-text)',
          maxHeight: 520,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--hospital-blue)" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--main-text)' }}>
              Queue Notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.35)',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--hospital-blue)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 6px',
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--muted-text)',
                cursor: 'pointer',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--neo-inset-sm)',
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingRight: 2,
          }}
        >
          {notifications && notifications.filter((n) => n.visit_type === 'REVISITING').length > 0 ? (
            notifications
              .filter((n) => n.visit_type === 'REVISITING')
              .map((notif) => {
                const tokenTag = notif.token_number?.startsWith('#')
                  ? notif.token_number
                  : `#${notif.token_number || 1}`;

                return (
                  <div
                    key={notif._id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: notif.read ? 'var(--surface-inset)' : 'var(--lavender-soft)',
                      border: notif.read ? '1px solid var(--border-subtle)' : '1px solid var(--hospital-blue)',
                      boxShadow: notif.read ? 'var(--neo-inset-sm)' : 'var(--neo-raised-sm)',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {!notif.read && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'var(--hospital-blue)',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: 'var(--deep-indigo)',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {tokenTag}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--main-text)' }}>
                        {notif.patient_name || 'Rahul Sharma'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--status-normal-bg)',
                          color: 'var(--status-normal-text)',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        REVISITING
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--muted-text)', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                      {notif.message || 'Patient has checked in for a revisit consultation.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--subtle-text)' }}>
                        {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>

                      <button
                        onClick={() => handleSelectNotification(notif)}
                        className="btn btn-hospital-blue"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.76rem',
                        }}
                      >
                        <span>Review</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted-text)' }}>
              <Bell size={28} style={{ margin: '0 auto 10px auto', opacity: 0.35 }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--main-text)' }}>
                No Unread Notifications
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-text)', margin: '4px 0 0 0' }}>
                You will be notified here when returning or priority patients check in.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
