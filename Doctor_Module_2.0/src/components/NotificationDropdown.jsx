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
          backgroundColor: 'rgba(5, 19, 41, 0.45)',
          zIndex: 998,
          display: 'none',
        }}
      />

      <div
        ref={dropdownRef}
        className="fade-in profile-dropdown-container"
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 400,
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: 18,
          border: '1px solid var(--border-medium)',
          boxShadow: '0 16px 36px rgba(10, 37, 64, 0.16)',
          zIndex: 999,
          padding: '18px 20px',
          color: 'var(--navy-900)',
          maxHeight: 520,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--blue-600)" />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '1px 8px',
                borderRadius: 12,
              }}>
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
                  fontWeight: 600,
                  color: 'var(--blue-600)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 4px',
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingRight: 2,
        }}>
          {notifications && notifications.filter(n => n.visit_type === 'REVISITING').length > 0 ? (
            notifications
              .filter(n => n.visit_type === 'REVISITING')
              .map((notif) => {
                const tokenTag = notif.token_number?.startsWith('#') ? notif.token_number : `#${notif.token_number || 1}`;

                return (
                  <div
                    key={notif._id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      backgroundColor: notif.read ? '#f8fafc' : '#eff6ff',
                      border: notif.read
                        ? '1px solid var(--border-subtle)'
                        : '1px solid #93c5fd',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingRight: notif.read ? 0 : 16 }}>
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}>
                          <span style={{ fontSize: '0.65rem' }}>🔵</span>
                          Returning Patient
                        </span>
                      </div>

                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#1e40af',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        letterSpacing: '0.02em',
                      }}>
                        REVISITING • Token {tokenTag}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--navy-900)',
                      marginBottom: 3,
                    }}>
                      {notif.title}
                    </h4>

                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--slate-600)',
                      lineHeight: 1.4,
                      marginBottom: 10,
                    }}>
                      {notif.message}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(0,0,0,0.05)',
                      paddingTop: 8,
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        onClick={() => handleSelectNotification(notif)}
                        className="btn-primary"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>View Patient</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--slate-500)' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--slate-100)',
                color: 'var(--slate-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
              }}>
                <Bell size={20} />
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                No notifications yet
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--slate-500)', marginTop: 2 }}>
                You will be notified here when returning patients join your consultation queue.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
