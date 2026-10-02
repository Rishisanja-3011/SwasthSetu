import React from 'react';
import { Activity } from 'lucide-react';
import './Navbar.css';

export function Navbar() {
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

