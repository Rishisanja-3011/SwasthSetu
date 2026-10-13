const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildClinicalIntake,
  sanitizeClinicalIntake,
} = require('../src/services/clinicalIntakeService');
const {
  normalizeLanguage,
  detectLanguage,
} = require('../src/services/languageService');
const {
  MAX_AUDIO_BYTES,
  TranscriptionError,
  transcribeAudio,
} = require('../src/services/transcriptionService');

test('normalizes supported language aliases and detects observed script', () => {
  assert.equal(normalizeLanguage('Gujarati', null), 'gu');
  assert.equal(normalizeLanguage('hi-IN', null), 'hi');
  assert.equal(detectLanguage('मुझे बुखार है', 'gu').language, 'hi');
});

test('preserves the original statement and extracts conservative multilingual fields', () => {
  const text = 'મને ત્રણ દિવસથી કમજોરી અને ચક્કર આવે છે. મને કોઈ એલર્જી નથી.';
  const result = buildClinicalIntake({
    text,
    selectedLanguage: 'gu',
    inputMode: 'TEXT',
    transcriptSource: 'PATIENT_TYPED',
  });

  assert.equal(result.transcript.text, text);
  assert.equal(result.transcript.source, 'PATIENT_TYPED');
  assert.equal(result.selected_language, 'gu');
  assert.deepEqual(result.clinical_intake.symptoms, ['dizziness', 'weakness']);
  assert.equal(result.clinical_intake.duration, '3 days');
  assert.equal(result.clinical_intake.allergy_status, 'NONE_REPORTED');
  assert.equal(result.clinical_intake.urgency, '');
  assert.equal(result.provenance.original_text, 'PATIENT_TYPED');
});

test('keeps denied symptoms separate from positive symptoms', () => {
  const result = buildClinicalIntake({
    text: 'मुझे बुखार नहीं है लेकिन खांसी है',
    selectedLanguage: 'hi',
    inputMode: 'TEXT',
  });

  assert.deepEqual(result.clinical_intake.symptoms, ['cough']);
  assert.deepEqual(result.clinical_intake.negative_symptoms, ['fever']);
});

test('does not create fake facts when extraction has no explicit clinical information', () => {
  const result = buildClinicalIntake({ text: 'नमस्ते', selectedLanguage: 'hi', inputMode: 'TEXT' });
  assert.equal(result.extraction_status, 'REVIEW_REQUIRED');
  assert.equal(result.clinical_intake.chief_complaint, '');
  assert.deepEqual(result.clinical_intake.symptoms, []);
});

test('sanitizes patient-edited structure to the contract', () => {
  const result = sanitizeClinicalIntake({
    chief_complaint: '  weakness  ',
    symptoms: ['dizziness', 'dizziness', 4],
    possible_symptom_categories: ['NEUROLOGICAL', 'DIAGNOSIS'],
    allergy_status: 'INVALID',
    urgency: 'EMERGENCY',
  });
  assert.equal(result.chief_complaint, 'weakness');
  assert.deepEqual(result.symptoms, ['dizziness']);
  assert.deepEqual(result.possible_symptom_categories, ['NEUROLOGICAL']);
  assert.equal(result.allergy_status, 'UNKNOWN');
  assert.equal(result.urgency, 'EMERGENCY');
});

test('rejects empty, oversized, and unsupported audio before provider access', async () => {
  await assert.rejects(
    () => transcribeAudio({ audioBuffer: Buffer.alloc(0), mimeType: 'audio/webm', preferredLanguage: 'gu' }),
    (error) => error instanceof TranscriptionError && error.code === 'EMPTY_AUDIO',
  );
  await assert.rejects(
    () => transcribeAudio({ audioBuffer: Buffer.from('audio'), mimeType: 'application/pdf', preferredLanguage: 'gu' }),
    (error) => error instanceof TranscriptionError && error.code === 'UNSUPPORTED_AUDIO_TYPE',
  );
  await assert.rejects(
    () => transcribeAudio({ audioBuffer: Buffer.alloc(MAX_AUDIO_BYTES + 1), mimeType: 'audio/webm', preferredLanguage: 'gu' }),
    (error) => error instanceof TranscriptionError && error.code === 'AUDIO_TOO_LARGE',
  );
});
