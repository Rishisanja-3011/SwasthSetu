import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export function NetworkStatusBanner() {
  const { isOnline } = usePatient();

  if (isOnline) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      borderBottom: '1px solid #fecaca',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '0.82rem',
      color: '#991b1b',
      fontWeight: '600',
    }}>
      <WifiOff size={15} />
      <span>Offline mode active. Your intake drafts and waiting status are saved locally.</span>
    </div>
  );
}
