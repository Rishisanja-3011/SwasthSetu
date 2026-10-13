import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { HomeScreen } from '../pages/HomeScreen';
import { DoctorConfirmScreen } from '../pages/DoctorConfirmScreen';
import { VisitTypeScreen } from '../pages/VisitTypeScreen';
import { DoctorAccessPermissionScreen } from '../pages/DoctorAccessPermissionScreen';
import { SymptomIntakeScreen } from '../pages/SymptomIntakeScreen';
import { IntakeReviewScreen } from '../pages/IntakeReviewScreen';
import { WaitingRoomScreen } from '../pages/WaitingRoomScreen';
import { ReportsScreen } from '../pages/ReportsScreen';
import { ReportDetailScreen } from '../pages/ReportDetailScreen';
import { TimelineScreen } from '../pages/TimelineScreen';
import { AssistantScreen } from '../pages/AssistantScreen';
import { DoctorDashboardScreen } from '../pages/DoctorDashboardScreen';

export function AppRoutes() {
  return (
    <Routes>
      {/* Patient Portal Dashboard (Primary App Route) */}
      <Route path="/" element={<HomeScreen />} />
      <Route path="/portal" element={<HomeScreen />} />
      <Route path="/patient" element={<HomeScreen />} />

      {/* Patient Check-in & Intake Flow */}
      <Route path="/doctor-confirm" element={<DoctorConfirmScreen />} />
      <Route path="/visit-type" element={<VisitTypeScreen />} />
      <Route path="/doctor-access-permission" element={<DoctorAccessPermissionScreen />} />
      <Route path="/intake" element={<SymptomIntakeScreen />} />
      <Route path="/intake-review" element={<IntakeReviewScreen />} />
      <Route path="/waiting" element={<WaitingRoomScreen />} />

      {/* Reports, Timeline & Assistant */}
      <Route path="/reports" element={<ReportsScreen />} />
      <Route path="/report/:reportId" element={<ReportDetailScreen />} />
      <Route path="/timeline" element={<TimelineScreen />} />
      <Route path="/assistant" element={<AssistantScreen />} />

      {/* Doctor Module Workspace */}
      <Route path="/doctor" element={<DoctorDashboardScreen />} />
      {/* Optional Hospital Landing Reference */}
      <Route path="/landing" element={<LandingPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
