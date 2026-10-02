// Base API client and state management simulator for Person 3

import {
  INITIAL_LABS,
  INITIAL_PATIENTS,
  INITIAL_REPORTS,
  INITIAL_VISIT_CONSENTS
} from './mockData';

const STORAGE_KEYS = {
  LABS: 'bloodreport_labs_v1',
  PATIENTS: 'bloodreport_patients_v1',
  REPORTS: 'bloodreport_reports_v1',
  VISIT_CONSENTS: 'bloodreport_visit_consents_v1',
  CURRENT_LAB_ID: 'bloodreport_active_lab_id_v1',
  ACCESS_LOGS: 'bloodreport_access_logs_v1'
};

// Initialize LocalStorage with seed data if not present
function initializeStore() {
  if (!localStorage.getItem(STORAGE_KEYS.LABS)) {
    localStorage.setItem(STORAGE_KEYS.LABS, JSON.stringify(INITIAL_LABS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VISIT_CONSENTS)) {
    localStorage.setItem(STORAGE_KEYS.VISIT_CONSENTS, JSON.stringify(INITIAL_VISIT_CONSENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_LAB_ID)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LAB_ID, JSON.stringify('lab_metro_diag_01'));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACCESS_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_LOGS, JSON.stringify([]));
  }
}

initializeStore();

// Generic Storage Get/Set helpers
export function getStoreItem(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (err) {
    console.error(`Error reading ${key} from storage`, err);
    return null;
  }
}

export function setStoreItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage`, err);
  }
}

// Log audit events per Section 8.2 & 12.37
export function logAuditEvent(actorType, actorId, patientId, action, details = {}) {
  const logs = getStoreItem(STORAGE_KEYS.ACCESS_LOGS) || [];
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    actor_type: actorType, // 'LABORATORY' | 'PATIENT' | 'DOCTOR' | 'SYSTEM'
    actor_id: actorId,
    patient_id: patientId,
    action, // 'searched' | 'viewed' | 'uploaded' | 'published' | 'corrected' | 'withdrawn'
    details,
    timestamp: new Date().toISOString()
  };
  logs.unshift(logEntry);
  setStoreItem(STORAGE_KEYS.ACCESS_LOGS, logs.slice(0, 100)); // retain last 100 for audit
  return logEntry;
}

export const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
export { STORAGE_KEYS };
