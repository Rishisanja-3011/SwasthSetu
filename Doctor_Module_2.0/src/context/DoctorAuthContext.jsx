import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../services/doctorApi';

const DoctorAuthContext = createContext(null);

export const DoctorAuthProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(() => doctorApi.getActiveDoctor());
  const [queue, setQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshQueue = useCallback(async () => {
    if (!doctor || (!doctor._id && !doctor.id)) return;
    try {
      const docId = doctor._id || doctor.id;
      const q = await doctorApi.getDoctorQueue(docId);
      setQueue(q);
    } catch (err) {
      console.error('Queue poll error:', err);
    }
  }, [doctor]);

  const refreshNotifications = useCallback(async () => {
    if (!doctor || (!doctor._id && !doctor.id)) return;
    try {
      const docId = doctor._id || doctor.id;
      const res = await doctorApi.getNotifications(docId);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Notifications poll error:', err);
    }
  }, [doctor]);

  useEffect(() => {
    if (doctor) {
      refreshQueue();
      refreshNotifications();
      // Poll queue and notifications every 3 seconds
      const interval = setInterval(() => {
        refreshQueue();
        refreshNotifications();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [doctor, refreshQueue, refreshNotifications]);

  const markNotificationRead = async (notificationId) => {
    await doctorApi.markNotificationRead(notificationId);
    setNotifications(prev =>
      prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsRead = async () => {
    if (!doctor) return;
    const docId = doctor._id || doctor.id;
    await doctorApi.markAllNotificationsRead(docId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await doctorApi.loginDoctor(credentials);
      setDoctor(doc);
      return doc;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await doctorApi.registerDoctor(data);
      setDoctor(doc);
      return doc;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    doctorApi.clearActiveDoctor();
    setDoctor(null);
    setQueue([]);
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <DoctorAuthContext.Provider
      value={{
        doctor,
        queue,
        refreshQueue,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        login,
        register,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
};

export const useDoctorAuth = () => {
  const context = useContext(DoctorAuthContext);
  if (!context) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
};
