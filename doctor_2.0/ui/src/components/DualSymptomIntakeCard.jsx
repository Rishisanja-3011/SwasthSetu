import React from 'react';
import { Calendar, FileText, ShieldCheck, Sparkles, Volume2, Mic } from 'lucide-react';

const EMPTY_VALUE = '— Not available yet —';

function displayValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : EMPTY_VALUE;
  return value === undefined || value === null || String(value).trim() === '' ? EMPTY_VALUE : value;
}

function Field({ label, value }) {
  const shown = displayValue(value);
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          color: 'var(--muted-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.88rem',
          fontWeight: 650,
          color: shown === EMPTY_VALUE ? 'var(--subtle-text)' : 'var(--main-text)',
          lineHeight: 1.4,
        }}
      >
        {shown}
      </div>
    </div>
  );
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--main-text)', margin: 0 }}>
            Dual-View Clinical Intake
          </h3>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-normal-bg)',
              color: 'var(--status-normal-text)',
              border: '1px solid var(--status-normal-border)',
              boxShadow: 'var(--neo-raised-sm)',
            }}
          >
            Patient-Confirmed
          </span>
        </div>
        <span style={{ fontSize: '0.76rem', color: data.audio_deleted ? '#0D9488' : 'var(--muted-text)', fontWeight: 600 }}>
          {data.audio_deleted ? '✓ Raw audio safely deleted' : isVoice ? 'Raw voice transient; purged at closure' : 'No raw audio recorded'}
        </span>
      </div>

      <div className="dual-intake-grid">
        {/* LEFT COLUMN: Verbatim Patient Statement */}
        <div
          className="v-card"
          style={{
            borderLeft: '4px solid var(--hospital-blue)',
            padding: 22,
            boxShadow: 'var(--neo-raised-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isVoice ? <Mic size={18} color="var(--hospital-blue)" /> : <FileText size={18} color="var(--hospital-blue)" />}
              <strong style={{ fontSize: '0.96rem', color: 'var(--main-text)' }}>Original Patient Statement</strong>
            </div>
            <span className="provenance-tag patient">
              {data.transcription_source || structuredData.transcript?.source || 'PATIENT_REPORTED'}
            </span>
          </div>

          <div
            style={{
              padding: '16px 18px',
              minHeight: 88,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-inset)',
              boxShadow: 'var(--neo-inset-sm)',
              border: '1px solid var(--border-inset)',
              color: transcript ? 'var(--main-text)' : 'var(--muted-text)',
              fontSize: '0.94rem',
              lineHeight: 1.6,
              fontStyle: transcript ? 'italic' : 'normal',
            }}
          >
            {transcript ? `“${transcript}”` : EMPTY_VALUE}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '14px 18px',
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Field label="Selected language" value={data.selected_language || data.language || structuredData.selected_language} />
            <Field label="Detected language" value={data.detected_language || structuredData.detected_language} />
            <Field label="Input mode" value={data.input_mode ? String(data.input_mode).toUpperCase() : 'VOICE'} />
            <Field label="Session recorded" value={sessionDate ? new Date(sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} />
          </div>
        </div>

        {/* RIGHT COLUMN: AI-Structured Clinical Summary */}
        <div
          className="v-card"
          style={{
            borderLeft: '4px solid var(--deep-indigo)',
            padding: 22,
            boxShadow: 'var(--neo-raised-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--deep-indigo)" />
              <strong style={{ fontSize: '0.96rem', color: 'var(--main-text)' }}>Structured Clinical Intake</strong>
            </div>
            <span className="provenance-tag ai">
              AI_STRUCTURED
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '14px 18px',
            }}
          >
            <Field label="Chief complaint" value={data.chief_complaint || clinical.chief_complaint} />
            <Field label="Duration" value={data.duration || clinical.duration} />
            <Field label="Associated symptoms" value={data.symptoms?.length ? data.symptoms : clinical.symptoms} />
            <Field label="Negative symptoms" value={data.negative_symptoms || clinical.negative_symptoms} />
            <Field label="Allergies" value={data.allergies || clinical.allergies} />
            <Field label="Current Medications" value={data.medications || clinical.medications} />
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              color: 'var(--muted-text)',
              fontSize: '0.74rem',
            }}
          >
            <ShieldCheck size={14} color="var(--hospital-blue)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Explicit patient statements only. No speculative diagnosis applied without physician clinical evaluation.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
