import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { AppRoutes } from './routes/AppRoutes';
import { usePatient } from './context/PatientContext';
import FloatingMediBot from './components/FloatingMediBot';
import { BackgroundEffect } from './components/BackgroundEffect';

function AppShell() {
  const { isAuthenticated } = usePatient();

  return (
    <div className="app-container">
      <BackgroundEffect />
      <a className="skip-link" href="#patient-main">Skip to content</a>
      {isAuthenticated && <Navbar />}
      <NetworkStatusBanner />
      <main id="patient-main" className="main-content" tabIndex={-1}>
        <AppRoutes />
      </main>
      {isAuthenticated && <BottomNav />}
      {isAuthenticated && <FloatingMediBot />}
    </div>
  );
}

export function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;
