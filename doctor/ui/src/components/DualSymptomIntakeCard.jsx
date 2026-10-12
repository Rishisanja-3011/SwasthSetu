import React from 'react';
import { Calendar, FileText, Sparkles, Volume2 } from 'lucide-react';

const EMPTY_VALUE = '— Not available yet —';

function displayValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : EMPTY_VALUE;
  return value === undefined || value === null || String(value).trim() === ''
    ? EMPTY_VALUE
    : value;
}

function Field({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 650, color: value === EMPTY_VALUE ? 'var(--slate-400)' : 'var(--navy-900)', lineHeight: 1.4 }}>
        {displayValue(value)}
      </div>
    </div>
  );
}

export const DualSymptomIntakeCard = ({ intake }) => {
  const data = intake || {};
  const structuredData = data.structured_data && typeof data.structured_data === 'object'
    ? data.structured_data
    : {};
  const clinicalIntake = structuredData.clinical_intake && typeof structuredData.clinical_intake === 'object'
    ? structuredData.clinical_intake
    : structuredData;
  const transcript = data.raw_transcript || data.transcript || '';
  const symptoms = Array.isArray(data.symptoms) && data.symptoms.length > 0
    ? data.symptoms
    : clinicalIntake.symptoms || [];
  const categories = data.possible_symptom_categories || clinicalIntake.possible_symptom_categories || [];
  const allergies = data.allergies || clinicalIntake.allergies || [];
  const confidenceValue = typeof data.confidence === 'object'
    ? data.confidence?.overall
    : data.confidence;
  const confidence = Number(confidenceValue);
  const sessionDate = data.session_created_at || data.created_at;

  return (
    <section style={{ marginBottom: 24 }} aria-label="Clinical intake">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)' }}>Clinical Intake</h3>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            Patient reported + structured view
          </span>
        </div>
        <span style={{ fontSize: '0.76rem', color: data.audio_deleted ? '#dc2626' : '#059669', fontWeight: 600 }}>
          {data.audio_deleted ? 'Raw audio permanently destroyed' : 'Raw audio is transient and deleted at closure'}
        </span>
      </div>

      {/* Block 1: original patient input */}
      <div className="v-card" style={{ marginBottom: 14, borderLeft: '4px solid #3b82f6', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 9, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {data.input_mode === 'VOICE' || data.input_mode === 'voice' ? <Volume2 size={19} color="#1d4ed8" /> : <FileText size={18} color="#1d4ed8" />}
            <strong style={{ fontSize: '0.95rem', color: 'var(--navy-900)' }}>Original Patient Intake</strong>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e40af', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: 12 }}>PATIENT_REPORTED</span>
        </div>

        <div style={{ padding: '14px 16px', minHeight: 76, borderRadius: 9, backgroundColor: '#f8fafc', border: '1px dashed var(--slate-300)', color: transcript ? 'var(--navy-950)' : 'var(--slate-400)', fontSize: '0.94rem', lineHeight: 1.55, fontStyle: transcript ? 'italic' : 'normal' }}>
          {transcript ? `"${transcript}"` : EMPTY_VALUE}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginTop: 14 }}>
          <Field label="Input mode" value={data.input_mode ? String(data.input_mode).toUpperCase() : ''} />
          <Field label="Language" value={data.language || structuredData.language || structuredData.selected_language || ''} />
          <Field label="Session created" value={sessionDate ? new Date(sessionDate).toLocaleString() : ''} />
          <Field label="Audio status" value={data.input_mode === 'VOICE' || data.input_mode === 'voice' ? (data.audio_deleted ? 'Deleted after closure' : 'Transient') : 'Not applicable'} />
        </div>
      </div>

      {/* Block 2: structured clinical intake */}
      <div className="v-card" style={{ borderLeft: '4px solid var(--teal-500)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 9, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={19} color="var(--teal-700)" />
            <strong style={{ fontSize: '0.95rem', color: 'var(--navy-900)' }}>Structured Clinical Intake</strong>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--teal-800)', backgroundColor: 'var(--teal-50)', padding: '3px 8px', borderRadius: 12 }}>STRUCTURED OUTPUT</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px 24px' }}>
          <Field label="Chief complaint" value={data.chief_complaint || clinicalIntake.chief_complaint} />
          <Field label="Duration" value={data.duration || clinicalIntake.duration} />
          <Field label="Possible symptom category" value={categories} />
          <Field label="Associated symptoms" value={symptoms} />
          <Field label="Allergies" value={allergies} />
          <Field label="Session created" value={sessionDate ? new Date(sessionDate).toLocaleString() : ''} />
          <Field label="Extraction confidence" value={Number.isFinite(confidence) && confidence > 0 ? `${Math.round(confidence * 100)}%` : ''} />
          <Field label="Relevant history" value={data.relevant_history || clinicalIntake.relevant_history || []} />
          <Field label="Medications" value={data.medications || clinicalIntake.medications || []} />
        </div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-500)', fontSize: '0.75rem' }}>
          <Calendar size={13} />
          Fields not yet available are intentionally left blank until the future multilingual extraction pipeline is connected.
        </div>
      </div>
    </section>
  );
};
