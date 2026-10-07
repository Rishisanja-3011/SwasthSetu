/**
 * VaaniDoc 2.0 - Doctor Clinical API Service
 * Interacts with authoritative backend Express API (/api/doctor)
 * Synchronizes encounter lifecycle state to ensure real-time Patient Module observation.
 */

const API_BASE = '/api/doctor';

const STORAGE_KEYS = {
  ACTIVE_DOCTOR: 'vaanidoc_doctor_session',
  ACTIVE_ENCOUNTER: 'vaanidoc_encounter_active',
};

export const doctorApi = {
  /**
   * Session Management
   */
  getActiveDoctor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_DOCTOR);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    // Default fallback doctor: Dr. Ramesh Mehta (DOC-409)
    return {
      id: '6ac63e0d4e6504757999625f',
      _id: '6ac63e0d4e6504757999625f',
      name: 'Dr. Ramesh Mehta',
      specialty: 'General Physician & Family Medicine',
      clinic_name: 'Mehta Community Health Clinic',
      doctor_code: 'DOC-409',
      qr_code_id: 'DOC-409',
      room_number: 'Cabin 2',
    };
  },

  setActiveDoctor(doctor) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DOCTOR, JSON.stringify(doctor));
  },

  clearActiveDoctor() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DOCTOR);
  },

  /**
   * 1. Register Doctor -> creates unique Doctor ID, unique Code, unique QR
   */
  async registerDoctor(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to register doctor');
    }
    this.setActiveDoctor(json.doctor);
    return json.doctor;
  },

  /**
   * 2. Login Doctor
   */
  async loginDoctor(credentials) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Invalid doctor login credentials');
    }
    this.setActiveDoctor(json.doctor);
    return json.doctor;
  },

  /**
   * 3. Get Doctor Profile & Stats
   */
  async getDoctorProfile(doctorId) {
    try {
      const res = await fetch(`${API_BASE}/profile/${doctorId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.doctor;
      }
    } catch (e) {
      console.warn('Profile fetch error, using active:', e);
    }
    return this.getActiveDoctor();
  },

  /**
   * 4. Get Today's Waiting Queue for THIS Doctor
   */
  async getDoctorQueue(doctorId) {
    try {
      const res = await fetch(`${API_BASE}/queue/${doctorId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.queue;
      }
    } catch (e) {
      console.warn('Queue fetch error:', e);
    }
    return [];
  },

  /**
   * 5. Review Symptoms
   * Sets status = WAITING, lifecycle_state = DOCTOR_REVIEWING
   */
  async reviewSymptoms(encounterId) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update encounter to review state');
    }

    // Mirror to local storage for instant multi-tab patient UI sync
    this._syncLocalEncounterState({
      encounterId,
      status: 'WAITING',
      lifecycle_state: 'DOCTOR_REVIEWING',
    });

    return json.encounter;
  },

  /**
   * 6. Clinical Cockpit Data (Strict Bounded Access)
   */
  async getCockpitData(encounterId) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/cockpit`);
    const json = await res.json();
    if (res.status === 403) {
      const err = new Error(json.error || 'BOUNDED_ACCESS_EXPIRED');
      err.code = 'BOUNDED_ACCESS_EXPIRED';
      err.status = 403;
      throw err;
    }
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch clinical cockpit data');
    }
    return json;
  },

  /**
   * 7. Start Consultation (Doctor calls patient in)
   * Sets status = IN_CONSULTATION, lifecycle_state = PLEASE_COME_IN
   */
  async startConsultation(encounterId) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to start consultation');
    }

    this._syncLocalEncounterState({
      encounterId,
      status: 'IN_CONSULTATION',
      lifecycle_state: 'PLEASE_COME_IN',
      started_at: json.encounter?.started_at || new Date().toISOString(),
    });

    return json.encounter;
  },

  /**
   * 8. Save Consultation Notes (notes_text)
   */
  async saveConsultationNotes(encounterId, notesText) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes_text: notesText }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save notes');
    }
    return json.note;
  },

  /**
   * 9. Create Diagnostic Order (CBC)
   */
  async orderDiagnostic(encounterId, { test_type = 'CBC', clinical_notes = '' }) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/order-diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_type, clinical_notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to order diagnostic');
    }
    return json.order;
  },

  /**
   * 10. End Consultation
   * Sets status = CLOSED, lifecycle_state = COMPLETED
   * Permanently deletes raw audio, locks access
   */
  async endConsultation(encounterId) {
    const res = await fetch(`${API_BASE}/encounter/${encounterId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to end consultation');
    }

    this._syncLocalEncounterState({
      encounterId,
      status: 'CLOSED',
      lifecycle_state: 'CONSULTATION_COMPLETED', // Maps to Patient Module isCompleted
      ended_at: json.encounter?.ended_at || new Date().toISOString(),
      audio_deleted: true,
      doctor_access_granted: false,
    });

    return json.encounter;
  },

  /**
   * 11. Helper to add a patient to queue for live testing
   */
  async checkinPatient(data) {
    const res = await fetch(`${API_BASE}/encounter/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to check-in patient');
    }
    return json;
  },

  /**
   * 12. Get Doctor In-App Notifications
   */
  async getNotifications(doctorId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${doctorId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return { notifications: json.notifications, unreadCount: json.unread_count };
      }
    } catch (e) {
      console.warn('Notifications fetch error:', e);
    }
    return { notifications: [], unreadCount: 0 };
  },

  /**
   * 13. Mark Single Notification as Read
   */
  async markNotificationRead(notificationId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  },

  /**
   * 14. Mark All Notifications as Read
   */
  async markAllNotificationsRead(doctorId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all/${doctorId}`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Mark all read error:', e);
    }
  },

  /**
   * Internal sync helper for local storage
   */
  _syncLocalEncounterState({ encounterId, status, lifecycle_state, started_at, ended_at, audio_deleted, doctor_access_granted }) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENCOUNTER);
      if (stored) {
        const active = JSON.parse(stored);
        active.status = status;
        active.lifecycle_state = lifecycle_state;
        if (started_at) active.started_at = started_at;
        if (ended_at) active.ended_at = ended_at;
        if (audio_deleted !== undefined) active.audio_deleted = audio_deleted;
        if (doctor_access_granted !== undefined) active.doctor_access_granted = doctor_access_granted;
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ENCOUNTER, JSON.stringify(active));
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  },
};
