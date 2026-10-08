import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorAuthProvider, useDoctorAuth } from './context/DoctorAuthContext';
import { DoctorNavbar } from './components/DoctorNavbar';
import { DoctorLoginScreen } from './pages/DoctorLoginScreen';
import { DoctorQueueScreen } from './pages/DoctorQueueScreen';
import { ClinicalCockpitScreen } from './pages/ClinicalCockpitScreen';
import { DoctorQRScreen } from './pages/DoctorQRScreen';

// Full-Width Clean Clinical Layout Shell (No Sidebar)
const DoctorLayout = ({ children }) => {
  const { doctor } = useDoctorAuth();

  if (!doctor) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <DoctorNavbar />
      <main className="main-wrapper" style={{ width: '100%' }}>
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
      </BrowserRouter>
    </DoctorAuthProvider>
  );
}
