import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { QrCode, FileText, Clock, MessageSquareHeart } from 'lucide-react';
import { useMediBotIntro } from '../context/MediBotIntroContext';
import './BottomNav.css';

export function BottomNav() {
  const { triggerMediBotIntro } = useMediBotIntro();
  const location = useLocation();

  return (
    <nav className="patient-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
        end
      >
        <QrCode className="nav-tab-icon" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
      >
        <FileText className="nav-tab-icon" />
        <span>Reports</span>
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
        onClick={(e) => {
          if (location.pathname !== '/assistant') {
            e.preventDefault();
            e.stopPropagation();
            triggerMediBotIntro();
          }
        }}
      >
        <MessageSquareHeart className="nav-tab-icon" />
        <span>Assistant</span>
      </NavLink>
    </nav>
  );
}
