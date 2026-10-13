import React from 'react';
import { Calendar, FileText, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';

const EMPTY_VALUE = '— Not available yet —';

function displayValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : EMPTY_VALUE;
  return value === undefined || value === null || String(value).trim() === '' ? EMPTY_VALUE : value;
}

function Field({ label, value }) {
  const shown = displayValue(value);
  return <div style={{ minWidth: 0 }}><div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div><div style={{ fontSize: '0.86rem', fontWeight: 650, color: shown === EMPTY_VALUE ? 'var(--slate-400)' : 'var(--navy-900)', lineHeight: 1.4 }}>{shown}</div></div>;
}

export const DualSymptomIntakeCard = ({ intake }) => {
  const data = intake || {};
  const structuredData = data.structured_data && typeof data.structured_data === 'object' ? data.structured_data : {};
  const clinical = structuredData.clinical_intake && typeof structuredData.clinical_intake === 'object' ? structuredData.clinical_intake : structuredData;
  const transcript = data.raw_transcript || data.transcript || structuredData.transcript?.text || '';
  const confidence = structuredData.confidence && typeof structuredData.confidence === 'object' ? structuredData.confidence : {};
  const provenance = structuredData.provenance && typeof structuredData.provenance === 'object' ? structuredData.provenance : data.provenance || {};
  const sessionDate = data.session_created_at || data.created_at;
  const isVoice = data.input_mode === 'VOICE' || data.input_mode === 'voice';
  const confidencePercent = Number(confidence.overall ?? data.confidence);

  return (
    <section style={{ marginBottom: 24 }} aria-label="Clinical intake">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)' }}>Clinical Intake</h3><span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>Patient-confirmed</span></div>
        <span style={{ fontSize: '0.76rem', color: data.audio_deleted ? '#059669' : '#64748b', fontWeight: 600 }}>{data.audio_deleted ? 'Raw audio deleted' : isVoice ? 'Raw audio transient; deleted at closure' : 'No raw audio retained'}</span>
      </div>

      <div className="v-card" style={{ marginBottom: 14, borderLeft: '4px solid #3b82f6', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 9, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{isVoice ? <Volume2 size={19} color="#1d4ed8" /> : <FileText size={18} color="#1d4ed8" />}<strong style={{ fontSize: '0.95rem', color: 'var(--navy-900)' }}>Original Patient Intake</strong></div><span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e40af', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: 12 }}>{data.transcription_source || structuredData.transcript?.source || 'PATIENT_REPORTED'}</span></div>
        <div style={{ padding: '14px 16px', minHeight: 76, borderRadius: 9, backgroundColor: '#f8fafc', border: '1px dashed var(--slate-300)', color: transcript ? 'var(--navy-950)' : 'var(--slate-400)', fontSize: '0.94rem', lineHeight: 1.55, fontStyle: transcript ? 'italic' : 'normal' }}>{transcript ? `“${transcript}”` : EMPTY_VALUE}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginTop: 14 }}><Field label="Selected language" value={data.selected_language || data.language || structuredData.selected_language} /><Field label="Detected language" value={data.detected_language || structuredData.detected_language} /><Field label="Language match" value={structuredData.language_match === null || structuredData.language_match === undefined ? '' : (structuredData.language_match ? 'Yes' : 'No')} /><Field label="Transcription confidence" value={confidence.transcription ? `${Math.round(confidence.transcription * 100)}%` : ''} /><Field label="Input mode" value={data.input_mode ? String(data.input_mode).toUpperCase() : ''} /><Field label="Session created" value={sessionDate ? new Date(sessionDate).toLocaleString() : ''} /></div>
      </div>

      <div className="v-card" style={{ borderLeft: '4px solid var(--teal-500)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 9, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={19} color="var(--teal-700)" /><strong style={{ fontSize: '0.95rem', color: 'var(--navy-900)' }}>Structured Clinical Intake</strong></div><span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--teal-800)', backgroundColor: 'var(--teal-50)', padding: '3px 8px', borderRadius: 12 }}>CONFIRMED BY PATIENT</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px 24px' }}><Field label="Chief complaint" value={data.chief_complaint || clinical.chief_complaint} /><Field label="Duration" value={data.duration || clinical.duration} /><Field label="Possible categories" value={data.possible_symptom_categories || clinical.possible_symptom_categories} /><Field label="Associated symptoms" value={data.symptoms?.length ? data.symptoms : clinical.symptoms} /><Field label="Negative symptoms" value={data.negative_symptoms || clinical.negative_symptoms} /><Field label="Allergies" value={data.allergies || clinical.allergies} /><Field label="Allergy status" value={data.allergy_status || clinical.allergy_status} /><Field label="Relevant history" value={data.relevant_history || clinical.relevant_history} /><Field label="Medications" value={data.medications || clinical.medications} /><Field label="Urgency flag" value={data.urgency || clinical.urgency} /><Field label="Overall confidence" value={confidencePercent > 0 ? `${Math.round(confidencePercent * 100)}%` : ''} /><Field label="Pipeline version" value={data.pipeline_version || structuredData.pipeline_version} /></div>
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--slate-100)', display: 'flex', gap: 7, alignItems: 'flex-start', color: 'var(--slate-500)', fontSize: '0.75rem' }}><ShieldCheck size={14} /><span>Provenance: original {provenance.original_text || EMPTY_VALUE}; language {provenance.detected_language || EMPTY_VALUE}; fields {provenance.structured_fields || EMPTY_VALUE}. Only explicit statements are included; this is not a diagnosis.</span></div>
        {provenance.field_provenance && <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>{Object.entries(provenance.field_provenance).map(([field, detail]) => { const source = typeof detail === 'string' ? detail : detail?.source; return <span key={field} style={{ fontSize: '0.68rem', padding: '2px 6px', background: '#f8fafc', borderRadius: 4, color: 'var(--slate-500)' }}>{field}: {source || EMPTY_VALUE}</span>; })}</div>}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-500)', fontSize: '0.75rem' }}><Calendar size={13} />Unknown or missing values remain blank.</div>
      </div>
    </section>
  );
};
