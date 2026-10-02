import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentLab, setCurrentLab] = useState(null);
  const [availableLabs, setAvailableLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLabData = async () => {
    try {
      setLoading(true);
      const [current, all] = await Promise.all([
        authApi.getCurrentLab(),
        authApi.getAllLabs()
      ]);
      setCurrentLab(current);
      setAvailableLabs(all);
    } catch (err) {
      console.error('Failed to load lab auth context', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabData();
  }, []);

  const switchLabAccount = async (labId) => {
    setLoading(true);
    const updated = await authApi.switchLab(labId);
    setCurrentLab(updated);
    setLoading(false);
  };

  const updateLabStatus = async (status) => {
    if (!currentLab) return;
    setLoading(true);
    const updated = await authApi.updateLabStatus(currentLab.id, status);
    setCurrentLab(updated);
    const all = await authApi.getAllLabs();
    setAvailableLabs(all);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentLab,
        availableLabs,
        loading,
        switchLabAccount,
        updateLabStatus,
        refreshLab: loadLabData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
