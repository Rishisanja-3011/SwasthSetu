import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Type, Sparkles, AlertCircle, ArrowLeft, FastForward, Globe,
} from 'lucide-react';
import { patientApi } from '../services/patientApi';
import { usePatient } from '../context/PatientContext';

const LANGUAGES = [
  { code: 'gu', speechCode: 'gu-IN', name: 'Gujarati (ગુજરાતી)', sample: 'મને ત્રણ દિવસથી ખૂબ જ કમજોરી લાગે છે અને ચક્કર પણ આવે છે.' },
  { code: 'hi', speechCode: 'hi-IN', name: 'Hindi (हिंदी)', sample: 'मुझे दो दिन से हल्का बुखार और शरीर में दर्द है।' },
  { code: 'mr', speechCode: 'mr-IN', name: 'Marathi (मराठी)', sample: 'मला कालपासून ताप आणि अंगदुखी होत आहे.' },
  { code: 'en', speechCode: 'en-IN', name: 'English', sample: 'I have had weakness and dizziness for the past 3 days.' },
];

export function SymptomIntakeScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateActiveEncounter } = usePatient();
  const doctor = location.state?.doctor;
  const visitType = location.state?.visitType || 'NEW';
  const doctorAccessGranted = location.state?.doctorAccessGranted || false;

  const [inputMode, setInputMode] = useState('voice');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [micDenied, setMicDenied] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const recorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!doctor) navigate('/');
  }, [doctor, navigate]);

  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return undefined;
    }
    const interval = setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && recordingSeconds >= 120) handleStopVoice();
  }, [isRecording, recordingSeconds]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  if (!doctor) return null;

  const handleStartVoice = async () => {
    setErrorMessage('');
    setMicDenied(false);
    setSpeechUnavailable(false);
    setTranscript('');
    setInterimTranscript('');
    setAudioBlob(null);
    audioChunksRef.current = [];
    setIsRecording(true);

    try {
      if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data?.size) audioChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const type = recorder.mimeType || 'audio/webm';
          setAudioBlob(new Blob(audioChunksRef.current, { type }));
          setIsStopping(false);
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        };
        recorder.start();
      }
    } catch (error) {
      setMicDenied(true);
      setErrorMessage('Microphone access was not available. If browser speech recognition works, you can still submit its transcript or switch to text.');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage.speechCode;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let finalText = '';
          let interimText = '';
          for (let index = 0; index < event.results.length; index += 1) {
            if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
            else interimText += event.results[index][0].transcript;
          }
          setTranscript(finalText);
          setInterimTranscript(interimText);
        };
        recognition.onerror = (event) => {
          if (event.error === 'not-allowed') setMicDenied(true);
          if (event.error !== 'aborted') setSpeechUnavailable(true);
        };
        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        setSpeechUnavailable(true);
      }
    } else {
      setSpeechUnavailable(true);
    }
  };

  const handleStopVoice = () => {
    setIsStopping(true);
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
    if (!recorder) setIsStopping(false);
  };

  const handleModeChange = (mode) => {
    if (isRecording || isStopping) handleStopVoice();
    setInputMode(mode);
    setErrorMessage('');
  };

  const getEncounter = async () => patientApi.createEncounter({ doctor, visitType });

  const handleProcessIntake = async () => {
    const text = inputMode === 'text' ? textInput : transcript;
    if (inputMode === 'text' && !text.trim()) {
      setErrorMessage('Please type your original statement before continuing.');
      return;
    }
    if (inputMode === 'voice' && !text.trim() && !audioBlob) {
      setErrorMessage('Please record or transcribe your statement before continuing.');
      return;
    }

    setErrorMessage('');
    setIsStructuring(true);
    try {
      const encounter = await getEncounter();
      const intake = inputMode === 'text'
        ? await patientApi.processTextIntake({ encounterId: encounter.id, language: selectedLanguage.code, text })
        : await patientApi.processVoiceIntake({
          encounterId: encounter.id,
          language: selectedLanguage.code,
          browserTranscript: text,
          transcriptReliable: Boolean(text.trim()),
          audioBlob,
        });
      navigate('/intake-review', {
        state: {
          doctor,
          visitType,
          doctorAccessGranted,
          encounter,
          inputMode: inputMode.toUpperCase(),
          intake,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || 'We could not prepare this intake. Nothing was submitted to the doctor.');
    } finally {
      setIsStructuring(false);
    }
  };

  const handleSkipForRevisiting = async () => {
    setErrorMessage('');
    setIsStructuring(true);
    try {
      const encounter = await getEncounter();
      const intake = await patientApi.prepareSkippedIntake({ encounterId: encounter.id });
      const confirmed = await patientApi.confirmIntake({ encounterId: encounter.id, inputMode: 'SKIPPED', structuredData: intake.structured_data });
      updateActiveEncounter({ ...encounter, intake: confirmed, queue_status: 'WAITING', lifecycle_state: 'WAITING' });
      navigate('/waiting', { replace: true });
    } catch (error) {
      setErrorMessage(error.message || 'We could not join the waiting room. Please try again.');
    } finally {
      setIsStructuring(false);
    }
  };

  return (
    <div className="fade-in page-centered-container" style={{ maxWidth: 700, padding: '8px 0' }}>
      <button onClick={() => navigate('/visit-type', { state: { doctor } })} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <span className="status-pill active" style={{ fontSize: '0.7rem' }}>{visitType === 'NEW' ? 'Mandatory Intake' : 'Optional Intake'}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>{doctor.name}</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', color: 'var(--navy-900)', marginBottom: 4 }}>Describe Your Symptoms</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--slate-600)' }}>
          Speak or type naturally. Your original statement is kept unchanged, then you review every normalized field before submission.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, backgroundColor: 'var(--slate-100)', padding: 4, borderRadius: 12, marginBottom: 20 }}>
        {[
          ['voice', <Mic size={18} />, 'Voice Input'],
          ['text', <Type size={18} />, 'Text Input'],
        ].map(([mode, icon, label]) => (
          <button key={mode} type="button" onClick={() => handleModeChange(mode)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: inputMode === mode ? '#ffffff' : 'transparent', color: inputMode === mode ? 'var(--teal-700)' : 'var(--slate-600)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: inputMode === mode ? 'var(--shadow-sm)' : 'none' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Globe size={14} /> Preferred language (a recognition hint, not a restriction)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LANGUAGES.map((language) => (
            <button key={language.code} type="button" onClick={() => setSelectedLanguage(language)} style={{ padding: '8px 10px', borderRadius: 8, fontSize: '0.8rem', textAlign: 'left', border: selectedLanguage.code === language.code ? '2px solid var(--teal-500)' : '1px solid var(--border-medium)', backgroundColor: selectedLanguage.code === language.code ? 'var(--teal-50)' : '#ffffff', color: selectedLanguage.code === language.code ? 'var(--teal-900)' : 'var(--slate-700)', fontWeight: selectedLanguage.code === language.code ? 700 : 500, cursor: 'pointer' }}>
              {language.name}
            </button>
          ))}
        </div>
      </div>

      {inputMode === 'voice' ? (
        <div>
          <div className="v-card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 20, border: isRecording ? '2px solid var(--teal-500)' : '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={isRecording ? handleStopVoice : handleStartVoice} disabled={isStructuring} style={{ width: 90, height: 90, borderRadius: '50%', backgroundColor: isRecording ? '#dc2626' : 'var(--teal-500)', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)', marginBottom: 14 }}>
              {isRecording ? <MicOff size={40} /> : <Mic size={42} />}
            </button>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: 4 }}>{isRecording ? `Recording (${recordingSeconds}s)...` : 'Tap to Speak Symptoms'}</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--slate-500)', maxWidth: 430, margin: '0 auto' }}>
              {isRecording ? 'Tap again when finished. The server will use the browser transcript when reliable, otherwise it will transcribe the audio.' : `Example: “${selectedLanguage.sample}”`}
            </p>
            {(micDenied || speechUnavailable) && <div style={{ marginTop: 14, color: '#9a3412', fontSize: '0.8rem' }}><AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />Browser support is limited; a recorded audio file can still use server transcription when configured.</div>}
          </div>
          {(transcript || interimTranscript) && <div className="v-card" style={{ padding: 16, marginBottom: 20, backgroundColor: 'var(--slate-50)' }}><span className="provenance-tag patient">{transcript ? 'PATIENT_SPOKEN_TRANSCRIPT' : 'TRANSCRIPT_IN_PROGRESS'}</span><p style={{ fontSize: '0.94rem', color: 'var(--navy-900)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 8 }}>&quot;{transcript || interimTranscript}&quot;</p>{!transcript && <p style={{ fontSize: '0.74rem', color: 'var(--slate-500)', marginTop: 7 }}>Only final browser speech segments are submitted as a transcript.</p>}</div>}
          <button type="button" className="btn btn-primary btn-block btn-lg" disabled={isStructuring || isRecording || isStopping || (!transcript.trim() && !audioBlob)} onClick={handleProcessIntake}>
            <Sparkles size={18} /> {isStructuring ? 'Preparing review...' : 'Review Structured Intake'}
          </button>
        </div>
      ) : (
        <div>
          <div className="v-card" style={{ padding: 18, marginBottom: 20 }}>
            <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: 8 }}>Your original statement</label>
            <textarea rows={5} value={textInput} onChange={(event) => setTextInput(event.target.value)} placeholder="Describe what you are experiencing, in any supported language..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-medium)', fontFamily: 'var(--font-sans)', fontSize: '0.94rem', lineHeight: 1.5, resize: 'vertical' }} />
          </div>
          <button type="button" className="btn btn-primary btn-block btn-lg" disabled={isStructuring || !textInput.trim()} onClick={handleProcessIntake}><Sparkles size={18} /> {isStructuring ? 'Preparing review...' : 'Structure & Review Symptoms'}</button>
        </div>
      )}

      {errorMessage && <div role="alert" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.84rem' }}><AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{errorMessage}</div>}

      {visitType === 'REVISITING' && <div style={{ textAlign: 'center', marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}><p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: 8 }}>No new symptoms to report?</p><button type="button" className="btn btn-secondary btn-block" disabled={isStructuring} onClick={handleSkipForRevisiting}><FastForward size={16} /> Skip intake and join queue</button></div>}
    </div>
  );
}
