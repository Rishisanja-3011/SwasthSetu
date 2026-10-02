import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import {
  Activity,
  Building2,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Bell
} from 'lucide-react';
import './Navbar.css';

export function Navbar() {
  const { currentLab, availableLabs, switchLabAccount, updateLabStatus } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!currentLab) return null;

  return (
    <header className="lab-navbar">
      <div className="navbar-brand">
        <div className="brand-logo-icon">
          <Activity size={22} className="logo-pulse" />
        </div>
        <div className="brand-text">
          <span className="brand-title">BloodReport</span>
          <span className="brand-subtitle">Laboratory Operations Portal</span>
        </div>
        <span className="brand-version-chip">v1.1</span>
      </div>

      <div className="navbar-controls">
        {/* Lab Switcher & Status Controller */}
        <div className="lab-selector-container">
          <button
            type="button"
            className="lab-selector-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Building2 size={16} className="building-icon" />
            <div className="lab-name-wrap">
              <span className="lab-current-name">{currentLab.name}</span>
              <span className="lab-license mono">{currentLab.license}</span>
            </div>
            <StatusBadge status={currentLab.admin_approval_status} size="sm" />
            <ChevronDown size={14} className="dropdown-caret" />
          </button>

          {dropdownOpen && (
            <div className="lab-dropdown-menu animate-fade-in">
              <div className="dropdown-section-title">Active Laboratory Facility</div>
              {availableLabs.map((lab) => (
                <div
                  key={lab.id}
                  className={`dropdown-lab-item ${lab.id === currentLab.id ? 'active' : ''}`}
                  onClick={() => {
                    switchLabAccount(lab.id);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="item-name">{lab.name}</div>
                  <div className="item-meta">
                    <span className="mono">{lab.license}</span>
                    <StatusBadge status={lab.admin_approval_status} size="sm" />
                  </div>
                </div>
              ))}

              <div className="dropdown-divider" />
              <div className="dropdown-section-title">Simulate Admin Approval State</div>
              <div className="status-toggle-row">
                <button
                  type="button"
                  className={`status-btn approved ${currentLab.admin_approval_status === 'APPROVED' ? 'selected' : ''}`}
                  onClick={() => {
                    updateLabStatus('APPROVED');
                    setDropdownOpen(false);
                  }}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`status-btn pending ${currentLab.admin_approval_status === 'PENDING' ? 'selected' : ''}`}
                  onClick={() => {
                    updateLabStatus('PENDING');
                    setDropdownOpen(false);
                  }}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`status-btn suspended ${currentLab.admin_approval_status === 'SUSPENDED' ? 'selected' : ''}`}
                  onClick={() => {
                    updateLabStatus('SUSPENDED');
                    setDropdownOpen(false);
                  }}
                >
                  Suspended
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="user-profile-widget">
          <div className="avatar-circle">LD</div>
          <div className="user-labels">
            <span className="user-title">Lab Director</span>
            <span className="user-role">Pathology Dept.</span>
          </div>
        </div>
      </div>
    </header>
  );
}
