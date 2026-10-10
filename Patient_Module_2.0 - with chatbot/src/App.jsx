import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <NetworkStatusBanner />
          <main className="main-content">
            <AppRoutes />
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;
