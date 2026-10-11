import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Minimize2, Send, X } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { sendMessageToMediBot } from '../services/mediBotApi';
import './FloatingMediBot.css';

const MAX_QUESTION_LENGTH = 1000;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safetyMessage(question) {
  const text = question.toLowerCase().trim();
  if (/\b(do i have|diagnose me|can you diagnose|what is my diagnosis|what disease do i have)\b/.test(text)) {
    return 'I can explain health information for education, but I cannot diagnose you. Please consult a qualified healthcare professional.';
  }
  if (/\b(prescribe|which medicine|what medicine|what dosage|how much medicine)\b/.test(text)) {
    return 'I cannot prescribe medicines or recommend personal doses. Please consult a qualified healthcare professional.';
  }
  return null;
}

function readMessages(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value)
      ? value.filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      : [];
  } catch {
    return [];
  }
}

export default function FloatingMediBot() {
  const { patient } = usePatient();
  const storageKey = useMemo(
    () => `vaanidoc-medibot-chat-${patient?.patient_identifier || 'patient'}`,
    [patient?.patient_identifier],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => readMessages(storageKey));
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages(readMessages(storageKey));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading, error]);

  const handleSend = async (event) => {
    event?.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || loading) return;

    setQuestion('');
    setError('');
    const userMessage = { id: createId(), role: 'user', content: currentQuestion };
    const safety = safetyMessage(currentQuestion);

    if (safety) {
      setMessages((previous) => [
        ...previous,
        userMessage,
        { id: createId(), role: 'assistant', content: safety },
      ]);
      return;
    }

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((previous) => [...previous, userMessage]);
    setLoading(true);

    try {
      const answer = await sendMessageToMediBot(currentQuestion.slice(0, MAX_QUESTION_LENGTH), history);
      setMessages((previous) => [...previous, { id: createId(), role: 'assistant', content: answer }]);
    } catch (requestError) {
      console.error('MediBot error:', requestError);
      setError('MediBot could not connect right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="floating-medibot">
      {isOpen && (
        <section className="floating-medibot-panel" aria-label="MediBot chat">
          <header className="floating-medibot-header">
            <div className="floating-medibot-heading">
              <span className="floating-medibot-avatar"><Bot size={22} /></span>
              <div>
                <strong>MediBot</strong>
                <span className="floating-medibot-online"><span /> Health education assistant</span>
              </div>
            </div>
            <div className="floating-medibot-header-actions">
              <button type="button" onClick={() => setMessages([])} disabled={loading} title="New chat" aria-label="New chat" className="floating-medibot-icon-button"><Minimize2 size={17} /></button>
              <button type="button" onClick={() => setIsOpen(false)} title="Close chat" aria-label="Close MediBot" className="floating-medibot-icon-button"><X size={20} /></button>
            </div>
          </header>

          <div className="floating-medibot-messages">
            {messages.length === 0 && (
              <div className="floating-medibot-welcome">
                <span className="floating-medibot-welcome-icon"><Bot size={28} /></span>
                <h3>Hello{patient?.name ? `, ${patient.name.split(' ')[0]}` : ''}!</h3>
                <p>Ask about health topics, blood tests, or general medical information.</p>
                <button type="button" onClick={() => setQuestion('What is hemoglobin?')}>What is hemoglobin?</button>
                <button type="button" onClick={() => setQuestion('What does a CBC blood test measure?')}>Explain a CBC test</button>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`floating-medibot-message ${message.role}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            ))}

            {loading && <div className="floating-medibot-message assistant">MediBot is thinking...</div>}
            {error && <div className="floating-medibot-error" role="alert">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="floating-medibot-input-area" onSubmit={handleSend}>
            <input ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask MediBot..." aria-label="Ask MediBot a question" maxLength={MAX_QUESTION_LENGTH} disabled={loading} />
            <button type="submit" disabled={loading || !question.trim()} aria-label="Send message"><Send size={18} /></button>
          </form>
          <p className="floating-medibot-disclaimer">General health education only. Not a substitute for medical advice.</p>
        </section>
      )}

      <button type="button" className="floating-medibot-launcher" onClick={() => setIsOpen((previous) => !previous)} aria-label={isOpen ? 'Close MediBot chat' : 'Open MediBot chat'} aria-expanded={isOpen} title="Chat with MediBot">
        {isOpen ? <X size={27} /> : <Bot size={29} />}
      </button>
    </div>
  );
}
