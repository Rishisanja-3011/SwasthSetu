import React from 'react';
import { NavLink } from 'react-router-dom';
import { QrCode, FileText, Clock, MessageSquareHeart } from 'lucide-react';
import './BottomNav.css';

export function BottomNav() {
  return (
    <nav className="patient-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
        end
      >
        <QrCode className="nav-tab-icon" />
        <span>Scan / Home</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
      >
        <FileText className="nav-tab-icon" />
        <span>My Reports</span>
      </NavLink>

      <NavLink
        to="/timeline"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
      >
        <Clock className="nav-tab-icon" />
        <span>Timeline</span>
      </NavLink>

      <NavLink
        to="/assistant"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
      >
        <MessageSquareHeart className="nav-tab-icon" />
        <span>Assistant</span>
      </NavLink>
    </nav>
  );
}
