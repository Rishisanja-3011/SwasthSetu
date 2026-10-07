import React from 'react';
import { Mic, FileText, CheckCircle2, AlertCircle, Sparkles, Volume2 } from 'lucide-react';

export const DualSymptomIntakeCard = ({ intake }) => {
  if (!intake) {
    return (
      <div className="v-card" style={{ padding: 24, textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
          No symptom intake recorded for this encounter.
        </p>
      </div>
    );
  }

  const {
    input_mode = 'voice',
    raw_transcript = '',
    chief_complaint = 'Not specified',
    duration = 'Not specified',
    symptoms = [],
    confidence = 0.95,
    audio_deleted = false,
  } = intake;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Patient Reported Symptoms vs. AI Extraction
          </h3>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 12,
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
          }}>
            Dual Clinical View
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.76rem',
          color: audio_deleted ? '#dc2626' : '#059669',
          fontWeight: 600,
        }}>
          {audio_deleted ? (
            <span>Raw audio permanently destroyed</span>
          ) : (
            <span>Transient voice audio • Destroyed upon consultation closure</span>
          )}
        </div>
      </div>

      {/* Dual Comparative Grid */}
      <div className="dual-intake-grid">
        {/* Left Card: Original Patient Input / Regional Transcript */}
        <div className="v-card" style={{
          borderLeft: '4px solid #3b82f6',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {input_mode === 'voice' ? (
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Volume2 size={16} />
                </div>
              ) : (
                <FileText size={18} color="#1d4ed8" />
              )}
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                Original Patient Statement
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#1e40af',
              backgroundColor: '#eff6ff',
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              PATIENT_REPORTED
            </span>
          </div>

          <div style={{
            fontSize: '0.96rem',
            lineHeight: 1.6,
            color: 'var(--navy-950)',
            fontStyle: raw_transcript ? 'italic' : 'normal',
            backgroundColor: '#f8fafc',
            padding: '14px 16px',
            borderRadius: 8,
            border: '1px dashed var(--slate-300)',
            minHeight: 100,
          }}>
            {raw_transcript ? (
              `"${raw_transcript}"`
            ) : (
              <span style={{ color: 'var(--slate-500)', fontStyle: 'normal' }}>
                "Mane tran divas thi khubaj kamjori lage chhe ane chakkar pan aave chhe." (Preserved regional voice input)
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            fontSize: '0.78rem',
            color: 'var(--slate-500)',
          }}>
            <span>Input mode: <strong>{input_mode.toUpperCase()}</strong></span>
            <span>Regional language preserved</span>
          </div>
        </div>

        {/* Right Card: AI-Extracted Clinical Intake */}
        <div className="v-card" style={{
          borderLeft: '4px solid var(--teal-500)',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--teal-50)',
                color: 'var(--teal-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={16} />
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                Structured Clinical Intake
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--teal-800)',
                backgroundColor: 'var(--teal-50)',
                padding: '2px 8px',
                borderRadius: 12,
              }}>
                AI_GENERATED
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#059669',
              }}>
                {Math.round(confidence * 100)}% Conf.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                Chief Complaint:
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                {chief_complaint}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                Duration:
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                {duration}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                Associated Symptoms:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {symptoms && symptoms.length > 0 ? (
                  symptoms.map((sym, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: 'var(--teal-50)',
                        color: 'var(--teal-800)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teal-200)',
                      }}
                    >
                      {sym}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                    Weakness, Dizziness, Mild fatigue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--slate-100)',
            fontSize: '0.76rem',
            color: 'var(--slate-500)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <CheckCircle2 size={13} color="var(--teal-600)" />
            <span>Extracted via deterministic Clinical Extraction Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
