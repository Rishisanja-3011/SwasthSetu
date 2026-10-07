import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  LogOut,
} from 'lucide-react';

export default function LabSidebar({
  currentView,
  onNavigate,
  onOpenProfile,
  onLogout,
  counts,
}) {
  return (
    <aside className="lab-sidebar">
      <div className="sidebar-nav-section">
        <div className="sidebar-heading">WORKSPACE</div>

        <button
          className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`sidebar-nav-item ${currentView === 'patient_visit' ? 'active' : ''}`}
          onClick={() => onNavigate('patient_visit')}
        >
          <Users size={18} />
          <span>Patient Visits</span>
          {counts?.pendingVisits > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                background: currentView === 'patient_visit' ? 'var(--blue-primary)' : 'var(--border-medium)',
                color: currentView === 'patient_visit' ? '#fff' : 'var(--text-secondary)',
                padding: '0.12rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              {counts.pendingVisits}
            </span>
          )}
        </button>

        <button
          className={`sidebar-nav-item ${currentView === 'reports' ? 'active' : ''}`}
          onClick={() => onNavigate('reports')}
        >
          <FileText size={18} />
          <span>Reports</span>
          {counts?.needsReview > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                background: '#ef4444',
                color: '#fff',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              {counts.needsReview}
            </span>
          )}
        </button>
      </div>

      <div className="sidebar-footer-section">
        <button
          className="sidebar-nav-item"
          onClick={onOpenProfile}
          title="View laboratory facility details"
        >
          <Building2 size={16} />
          <span>Lab Profile</span>
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onLogout}
          title="Log out of laboratory portal"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
