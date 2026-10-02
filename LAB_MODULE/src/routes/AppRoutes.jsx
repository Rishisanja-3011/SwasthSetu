import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LabLayout } from '../layouts/LabLayout';
import { LabDashboard } from '../pages/lab/LabDashboard';
import { LabPatientSearch } from '../pages/lab/LabPatientSearch';
import { LabPatientVerify } from '../pages/lab/LabPatientVerify';
import { LabReportUpload } from '../pages/lab/LabReportUpload';
import { LabReportReview } from '../pages/lab/LabReportReview';
import { LabReportVersions } from '../pages/lab/LabReportVersions';
import { LabReportsList } from '../pages/lab/LabReportsList';
import { LabAuditLogs } from '../pages/lab/LabAuditLogs';

export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect directly to laboratory dashboard */}
      <Route path="/" element={<Navigate to="/lab/dashboard" replace />} />

      {/* Laboratory Routes Section 21 */}
      <Route path="/lab" element={<LabLayout />}>
        <Route index element={<Navigate to="/lab/dashboard" replace />} />
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="patients/search" element={<LabPatientSearch />} />
        <Route path="patients/:patientId/verify" element={<LabPatientVerify />} />
        <Route path="reports/upload" element={<LabReportUpload />} />
        <Route path="reports" element={<LabReportsList />} />
        <Route path="reports/:reportId" element={<LabReportReview />} />
        <Route path="reports/:reportId/review" element={<LabReportReview />} />
        <Route path="reports/:reportId/versions" element={<LabReportVersions />} />
        <Route path="audit" element={<LabAuditLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/lab/dashboard" replace />} />
    </Routes>
  );
}
