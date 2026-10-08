import React, { createContext, useContext, useState, useEffect } from 'react';
import { patientApi, DEFAULT_PATIENTS } from '../services/patientApi';

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const [patient, setPatient] = useState(() => patientApi.getActivePatient());
  const [activeEncounter, setActiveEncounter] = useState(() => patientApi.getActiveEncounter());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState(navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('ONLINE');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll / check active encounter updates periodically
  useEffect(() => {
    const checkEncounter = () => {
      const enc = patientApi.getActiveEncounter();
      setActiveEncounter(enc);
    };
    const interval = setInterval(checkEncounter, 2000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const switchPatient = (selectedPatient) => {
    patientApi.setActivePatient(selectedPatient);
    setPatient(selectedPatient);
    setRefreshTrigger((prev) => prev + 1);
  };

  const updateActiveEncounter = (enc) => {
    setActiveEncounter(enc);
    setRefreshTrigger((prev) => prev + 1);
  };

  const clearEncounter = () => {
    patientApi.clearActiveEncounter();
    setActiveEncounter(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <PatientContext.Provider
      value={{
        patient,
        switchPatient,
        allPatients: DEFAULT_PATIENTS,
        activeEncounter,
        updateActiveEncounter,
        clearEncounter,
        isOnline,
        connectionStatus,
        refreshTrigger,
        triggerRefresh: () => setRefreshTrigger((p) => p + 1),
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used within PatientProvider');
  return ctx;
}
