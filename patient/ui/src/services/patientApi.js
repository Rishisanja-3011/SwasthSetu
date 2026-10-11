const API_BASE = '/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'vaani_doc_patient_access_token',
  PATIENT: 'vaani_doc_patient_profile',
  ACTIVE_ENCOUNTER: 'vaani_doc_patient_active_encounter',
};

function parseResponse(response, json) {
  if (response.ok) return json;
  const error = new Error(json?.message || json?.error || 'Request failed');
  error.status = response.status;
  error.code = json?.error;
  throw error;
}

async function request(path, options = {}, authenticated = true) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (authenticated) {
    const token = patientApi.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await response.json().catch(() => ({}));
  return parseResponse(response, json);
}

function savePatientSession(accessToken, patient) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
}

export const patientApi = {
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getStoredPatient() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENT);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveSession(accessToken, patient) {
    savePatientSession(accessToken, patient);
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PATIENT);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ENCOUNTER);
  },

  async getCurrentProfile() {
    const result = await request('/auth/me');
    if (result.user?.role !== 'PATIENT' || !result.profile) {
      throw new Error('This session is not a patient session.');
    }
    savePatientSession(this.getAccessToken(), result.profile);
    return result.profile;
  },

  async requestOtp({ phone, providerCode = null }) {
    return request('/auth/patient/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, provider_code: providerCode || undefined }),
    }, false);
  },

  async verifyOtp({ challengeId, otp }) {
    return request('/auth/patient/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, otp }),
    }, false);
  },

  async registerPatient({ registrationToken, name, age, dateOfBirth, gender }) {
    const result = await request('/auth/patient/register', {
      method: 'POST',
      body: JSON.stringify({
        registration_token: registrationToken,
        name,
        age: age ? Number(age) : null,
        date_of_birth: dateOfBirth || null,
        gender,
      }),
    }, false);
    savePatientSession(result.access_token, result.patient);
    return result;
  },

  async resolveCode(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) throw new Error('Code is required.');

    const result = await request(`/providers/resolve/${encodeURIComponent(clean)}`, {}, false);
    const provider = result.provider;
    if (provider.provider_type === 'DOCTOR') {
      return {
        type: 'DOCTOR',
        code: provider.provider_code,
        entity: {
          id: provider.provider_id,
          _id: provider.provider_id,
          qr_code_id: provider.provider_code,
          name: provider.name,
          specialty: provider.specialty,
          clinic_name: provider.clinic_name,
        },
      };
    }

    return {
      type: 'LABORATORY',
      code: provider.provider_code,
      entity: {
        id: provider.provider_id,
        _id: provider.provider_id,
        qr_code_id: provider.provider_code,
        name: provider.name,
        location: provider.location,
      },
    };
  },

  async getPublishedReports() {
    const result = await request('/patient/reports');
    return result.reports || [];
  },

  async getReportById(reportId) {
    const result = await request(`/patient/reports/${encodeURIComponent(reportId)}`);
    return result.report || null;
  },

  async getLabGrants() {
    const result = await request('/patient/lab-grants');
    return result.grants || [];
  },

  async approveLabGrant({ laboratory }) {
    const result = await request('/patient/lab-grants', {
      method: 'POST',
      body: JSON.stringify({ laboratory_code: laboratory.qr_code_id }),
    });
    return result.grant;
  },

  async createEncounter({ doctor, visitType }) {
    const result = await request('/patient/encounters', {
      method: 'POST',
      body: JSON.stringify({ doctor_code: doctor.qr_code_id, visit_type: visitType }),
    });
    const encounter = result.encounter;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENCOUNTER, JSON.stringify(encounter));
    return encounter;
  },

  async submitIntake({ encounterId, inputMode, rawTranscript, structuredData, confidence = 0.94 }) {
    const result = await request(`/patient/encounters/${encounterId}/intake`, {
      method: 'POST',
      body: JSON.stringify({
        input_mode: String(inputMode || '').toUpperCase(),
        transcript: rawTranscript || '',
        structured_data: structuredData || {},
        confidence,
      }),
    });
    return result.intake;
  },

  getActiveEncounter() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENCOUNTER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async refreshEncounter(encounterId) {
    const result = await request(`/patient/encounters/${encounterId}`);
    const encounter = result.encounter;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENCOUNTER, JSON.stringify(encounter));
    return encounter;
  },

  clearActiveEncounter() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ENCOUNTER);
  },

  async getHealthTimeline() {
    const result = await request('/patient/timeline');
    return result.events || [];
  },

  /**
   * Fixed, report-grounded educational explanations. This remains client-side
   * until the assistant API is added; it never generates a diagnosis or advice.
   */
  async queryAssistant(questionText, contextReport = null) {
    const query = String(questionText || '').toLowerCase().trim();
    if (query.includes('diagnos') || query.includes('cancer') || query.includes('dengue') || query.includes('disease') || query.includes('cure')) {
      return {
        answer: 'VaaniDoc does not provide medical diagnoses. Please discuss symptoms and report findings directly with your doctor.',
        isSafetyNotice: true,
      };
    }
    if (query.includes('medicine') || query.includes('tablet') || query.includes('prescription') || query.includes('dose') || query.includes('what should i take')) {
      return {
        answer: 'VaaniDoc does not prescribe medicines or recommend dosages. Treatment decisions must come from your licensed physician.',
        isSafetyNotice: true,
      };
    }

    const observations = contextReport?.observations || [];
    if (query.includes('hemoglobin') || query.includes('haemoglobin') || query.includes('hb')) {
      const observation = observations.find((item) => item.test_name_normalized?.toLowerCase().includes('hemoglobin'));
      return {
        answer: observation
          ? `Your published report shows Hemoglobin at ${observation.value} ${observation.unit || ''} (${observation.flag || 'not flagged'}). ${observation.explanation || ''}`
          : 'Hemoglobin is the oxygen-carrying protein in red blood cells. Ask your doctor to interpret your result in context.',
        isSafetyNotice: false,
      };
    }
    if (query.includes('wbc') || query.includes('white blood') || query.includes('leucocyte')) {
      const observation = observations.find((item) => item.test_name_normalized?.toLowerCase().includes('wbc'));
      return {
        answer: observation
          ? `Your published report shows WBC at ${observation.value} ${observation.unit || ''} (${observation.flag || 'not flagged'}). ${observation.explanation || ''}`
          : 'White blood cells are part of the immune system. Ask your doctor to interpret the report-specific result.',
        isSafetyNotice: false,
      };
    }
    if (query.includes('platelet') || query.includes('clot') || query.includes('bleeding')) {
      const observation = observations.find((item) => item.test_name_normalized?.toLowerCase().includes('platelet'));
      return {
        answer: observation
          ? `Your published report shows Platelets at ${observation.value} ${observation.unit || ''} (${observation.flag || 'not flagged'}). ${observation.explanation || ''}`
          : 'Platelets help the blood form clots. Ask your doctor to interpret the report-specific result.',
        isSafetyNotice: false,
      };
    }
    return {
      answer: 'A Complete Blood Count measures red blood cells, white blood cells, and platelets. HIGH or LOW flags compare a value with the laboratory-provided reference range.',
      isSafetyNotice: false,
    };
  },
};
