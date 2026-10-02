// Laboratory Authentication & Account Context API

import { getStoreItem, setStoreItem, STORAGE_KEYS, delay } from './api';

export const authApi = {
  // Get active laboratory user / account
  getCurrentLab: async () => {
    await delay(150);
    const activeLabId = getStoreItem(STORAGE_KEYS.CURRENT_LAB_ID) || 'lab_metro_diag_01';
    const labs = getStoreItem(STORAGE_KEYS.LABS) || [];
    const currentLab = labs.find((l) => l.id === activeLabId) || labs[0];
    return currentLab;
  },

  // Switch between mock labs (for testing different onboarding states: APPROVED, PENDING, SUSPENDED)
  switchLab: async (labId) => {
    await delay(200);
    setStoreItem(STORAGE_KEYS.CURRENT_LAB_ID, labId);
    const labs = getStoreItem(STORAGE_KEYS.LABS) || [];
    return labs.find((l) => l.id === labId);
  },

  // Update lab account status (for testing edge cases like suspension)
  updateLabStatus: async (labId, newStatus) => {
    await delay(250);
    const labs = getStoreItem(STORAGE_KEYS.LABS) || [];
    const updated = labs.map((l) => (l.id === labId ? { ...l, admin_approval_status: newStatus } : l));
    setStoreItem(STORAGE_KEYS.LABS, updated);
    return updated.find((l) => l.id === labId);
  },

  getAllLabs: async () => {
    await delay(100);
    return getStoreItem(STORAGE_KEYS.LABS) || [];
  }
};
