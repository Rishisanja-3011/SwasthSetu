import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar/Navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useAuth } from '../context/AuthContext';
import { labApi } from '../services/labApi';
import { AlertTriangle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import './LabLayout.css';

export function LabLayout() {
  const { currentLab, loading } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (currentLab?.id) {
      labApi.getLabReports(currentLab.id, 'PENDING').then((reports) => {
        setPendingCount(reports.length);
      });
    }
  }, [currentLab]);

  if (loading || !currentLab) {
    return (
      <div className="layout-loading-screen">
        <div className="spinner spinner-primary" />
        <p className="loading-text">Loading Laboratory Workspace...</p>
      </div>
    );
  }

  const isSuspended = currentLab.admin_approval_status === 'SUSPENDED';
  const isPendingApproval = currentLab.admin_approval_status === 'PENDING';

  return (
    <div className="lab-app-container">
      <Navbar />

      {/* Admin Onboarding Status Warning Banner (Section 16: Lab account is pending or suspended) */}
      {isSuspended && (
        <div className="lab-status-banner banner-suspended">
          <ShieldAlert size={18} />
          <div className="banner-content">
            <strong>Laboratory Account Suspended:</strong> Platform Administration has placed {currentLab.name} on suspension.
            All patient search, report upload, and publishing actions are temporarily blocked.
          </div>
        </div>
      )}

      {isPendingApproval && (
        <div className="lab-status-banner banner-pending">
          <AlertTriangle size={18} />
          <div className="banner-content">
            <strong>Platform Onboarding Pending:</strong> {currentLab.name} is awaiting administrative review.
            Report ingestion will remain inactive until platform admin approval is granted.
          </div>
        </div>
      )}

      <div className="lab-main-body">
        <Sidebar pendingCount={pendingCount} />
        <main className="lab-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
