import React, { useState } from 'react';
import { Stethoscope, LogOut, ShieldCheck, ChevronDown, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { DoctorProfileDropdown } from './DoctorProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';

export const DoctorNavbar = () => {
  const { doctor, logout, unreadCount } = useDoctorAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = doctor?.name?.replace('Dr. ', '').charAt(0) || 'D';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand & Clinic Info (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: 'var(--teal-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 168, 132, 0.25)',
          }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--navy-900)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              VaaniDoc <span style={{ color: 'var(--teal-500)', fontSize: '0.82rem', fontWeight: 700, padding: '2px 6px', background: 'var(--teal-50)', borderRadius: 6 }}>DOCTOR 2.0</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 500 }}>
              {doctor?.clinic_name || 'Mehta Community Health Clinic'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Interactive Doctor Profile (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Bounded Access Assurance Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          fontSize: '0.76rem',
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: 20,
          border: '1px solid #bfdbfe',
        }}>
          <ShieldCheck size={14} />
          <span>Encounter-Bounded Access Active</span>
        </div>

        {/* NOTIFICATION BELL WITH COUNTER */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isNotificationOpen ? 'var(--blue-50)' : '#ffffff',
              border: isNotificationOpen ? '1px solid var(--blue-300)' : '1px solid var(--border-medium)',
              color: unreadCount > 0 ? 'var(--blue-600)' : 'var(--slate-600)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
            title={`${unreadCount} notifications`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Queue Notifications Dropdown Panel */}
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* CLICKABLE DOCTOR IDENTITY AREA (Opens Doctor Profile Dropdown) */}
        {doctor && (
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationOpen(false);
              }}
              role="button"
              tabIndex={0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 14px 5px 6px',
                backgroundColor: isProfileOpen ? 'var(--blue-50)' : 'var(--slate-50)',
                borderRadius: 24,
                border: isProfileOpen ? '1px solid var(--blue-400)' : '1px solid var(--slate-200)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
              title="Click to view Doctor Profile, QR code & Doctor Code"
            >
              {/* Doctor Avatar Initial */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--navy-900)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {initial}
              </div>

              {/* Name & Code */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                  {doctor.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--teal-700)', fontWeight: 700 }}>
                  Code: {doctor.doctor_code || doctor.qr_code_id}
                </div>
              </div>

              {/* Caret Down Indicator */}
              <ChevronDown
                size={15}
                color="var(--slate-500)"
                style={{
                  transform: isProfileOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  marginLeft: 2,
                }}
              />
            </div>

            {/* Doctor Profile Popup Panel */}
            <DoctorProfileDropdown
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
            />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--slate-500)',
            fontSize: '0.82rem',
            fontWeight: 600,
            padding: '7px 10px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
          title="Switch Doctor or Sign Out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
};
