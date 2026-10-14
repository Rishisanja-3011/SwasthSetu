import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorAuthProvider, useDoctorAuth } from './context/DoctorAuthContext';
import { DoctorNavbar } from './components/DoctorNavbar';
import { BackgroundEffect } from './components/BackgroundEffect';
import { DoctorLoginScreen } from './pages/DoctorLoginScreen';
import { DoctorQueueScreen } from './pages/DoctorQueueScreen';
import { ClinicalCockpitScreen } from './pages/ClinicalCockpitScreen';
import { DoctorQRScreen } from './pages/DoctorQRScreen';
import { Activity } from 'lucide-react';

// Full-Width Clean Clinical Layout Shell with Neomorphic Background
const DoctorLayout = ({ children }) => {
  const { doctor, authLoading } = useDoctorAuth();

  if (authLoading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="v-card fade-in" style={{ padding: '36px 48px', textAlign: 'center', maxWidth: 420 }}>
          <div className="stat-card-icon spin" style={{ margin: '0 auto 16px auto', width: 48, height: 48, borderRadius: 14 }}>
            <Activity size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--main-text)' }}>Restoring Doctor Session</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted-text)', marginTop: 6 }}>
            Validating encounter credentials and doctor cockpit...
          </p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <DoctorNavbar />
      <main className="main-wrapper">
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DoctorAuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <BackgroundEffect />
          <Routes>
            <Route path="/login" element={<DoctorLoginScreen />} />

            <Route
              path="/"
              element={
                <DoctorLayout>
                  <DoctorQueueScreen />
                </DoctorLayout>
              }
            />

            <Route
              path="/cockpit/:encounterId"
              element={
                <DoctorLayout>
                  <ClinicalCockpitScreen />
                </DoctorLayout>
              }
            />

            <Route
              path="/qr"
              element={
                <DoctorLayout>
                  <DoctorQRScreen />
                </DoctorLayout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DoctorAuthProvider>
  );
}
