import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  UploadCloud,
  FileSpreadsheet,
  ShieldCheck,
  FileCheck2,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export function Sidebar({ pendingCount = 0 }) {
  const { currentLab } = useAuth();
  const isApproved = currentLab?.admin_approval_status === 'APPROVED';

  return (
    <aside className="lab-sidebar">
      <div className="sidebar-section-group">
        <span className="sidebar-group-title">Laboratory Operations</span>
        <nav className="sidebar-nav">
          <NavLink
            to="/lab/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="link-icon" />
            <span className="link-label">Dashboard Overview</span>
          </NavLink>

          <NavLink
            to="/lab/patients/search"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Search size={18} className="link-icon" />
            <span className="link-label">Patient Identity Lookup</span>
          </NavLink>

          <NavLink
            to="/lab/reports/upload"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${!isApproved ? 'disabled-link' : ''}`
            }
          >
            <UploadCloud size={18} className="link-icon" />
            <span className="link-label">Attach / Upload Report</span>
            {!isApproved && <span className="lock-tag">Locked</span>}
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section-group">
        <span className="sidebar-group-title">Clinical Ingestion & Records</span>
        <nav className="sidebar-nav">
          <NavLink
            to="/lab/reports"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={18} className="link-icon" />
            <span className="link-label">Reports Registry</span>
            {pendingCount > 0 && (
              <span className="counter-pill">{pendingCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/lab/audit"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} className="link-icon" />
            <span className="link-label">Access Audit Log</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer-card">
        <div className="security-notice-header">
          <ShieldCheck size={16} className="sec-icon" />
          <span>V1.1 Consent Boundary</span>
        </div>
        <p className="security-notice-text">
          Patient identity is an identifier pointer, never an access credential. Medical reports require explicit visit consent.
        </p>
      </div>
    </aside>
  );
}
