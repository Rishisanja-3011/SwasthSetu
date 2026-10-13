const { detectLanguage, normalizeLanguage } = require('./languageService');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
]);
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

class TranscriptionError extends Error {
  constructor(message, code = 'VOICE_TRANSCRIPTION_FAILED') {
    super(message);
    this.name = 'TranscriptionError';
    this.code = code;
  }
}

function normalizeMimeType(value) {
  return String(value || '').toLowerCase().split(';', 1)[0].trim();
}

function parseModelResponse(payload) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || '';
  if (!text) throw new TranscriptionError('The transcription service returned no transcript.', 'EMPTY_TRANSCRIPT');

  let parsed;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // A plain response is still a verbatim transcript. No summarization or
    // clinical interpretation is performed in this service.
    parsed = { transcript: text, language: '' };
  }

  const transcript = typeof parsed.transcript === 'string' ? parsed.transcript : '';
  if (!transcript.trim()) throw new TranscriptionError('The transcription service returned an empty transcript.', 'EMPTY_TRANSCRIPT');
  const detected = normalizeLanguage(parsed.language, null) || detectLanguage(transcript, null).language;
  if (!detected) throw new TranscriptionError('The spoken language could not be detected.', 'LANGUAGE_NOT_DETECTED');
  return {
    transcript,
    detected_language: detected,
    language_confidence: Number.isFinite(Number(parsed.language_confidence))
      ? Math.max(0, Math.min(1, Number(parsed.language_confidence)))
      : detectLanguage(transcript, detected).confidence,
    transcription_confidence: Number.isFinite(Number(parsed.transcription_confidence))
      ? Math.max(0, Math.min(1, Number(parsed.transcription_confidence)))
      : 0.75,
  };
}

async function transcribeAudio({ audioBuffer, mimeType, preferredLanguage }) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    throw new TranscriptionError('Audio recording is empty.', 'EMPTY_AUDIO');
  }
  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    throw new TranscriptionError('Audio recording exceeds the 10 MB limit.', 'AUDIO_TOO_LARGE');
  }
  const normalizedMimeType = normalizeMimeType(mimeType);
  if (!SUPPORTED_AUDIO_MIME_TYPES.has(normalizedMimeType)) {
    throw new TranscriptionError('Unsupported audio format.', 'UNSUPPORTED_AUDIO_TYPE');
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new TranscriptionError(
      'Server voice transcription is unavailable. Please enable browser transcription or use typed text.',
      'VOICE_TRANSCRIPTION_UNAVAILABLE',
    );
  }

  const selected = normalizeLanguage(preferredLanguage, null);
  const languageHint = selected
    ? `The patient selected ${selected} as a preferred language. Use it as a hint only; detect a different spoken language when the audio clearly uses one.`
    : 'Detect the spoken language from the audio.';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: normalizedMimeType,
                data: audioBuffer.toString('base64'),
              },
            },
            {
              text: `You are a verbatim multilingual speech transcription engine. Transcribe only what the patient says. Do not summarize, diagnose, translate, or add words. Preserve the spoken language. ${languageHint} Return JSON only with keys transcript, language, language_confidence, transcription_confidence.`,
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    });

    if (!response.ok) {
      throw new TranscriptionError('The server transcription service could not process this recording.', 'TRANSCRIPTION_PROVIDER_FAILED');
    }
    const payload = await response.json().catch(() => null);
    return parseModelResponse(payload);
  } catch (error) {
    if (error instanceof TranscriptionError) throw error;
    throw new TranscriptionError('The server transcription service is temporarily unavailable.', 'TRANSCRIPTION_PROVIDER_FAILED');
  }
}

module.exports = {
  MAX_AUDIO_BYTES,
  SUPPORTED_AUDIO_MIME_TYPES,
  TranscriptionError,
  normalizeMimeType,
  transcribeAudio,
};
