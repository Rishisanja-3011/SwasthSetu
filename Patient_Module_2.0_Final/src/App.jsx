import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import { BackgroundEffect } from './components/BackgroundEffect';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes';
import { MediBotIntroProvider } from './context/MediBotIntroContext';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/landing';

  return (
    <div className={`app-container ${isLanding ? 'is-landing-page' : ''}`}>
      <BackgroundEffect />
      <Navbar />
      <NetworkStatusBanner />
      <main className={`main-content ${isLanding ? 'is-landing' : ''}`}>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}

export function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <MediBotIntroProvider>
          <AppContent />
        </MediBotIntroProvider>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;
