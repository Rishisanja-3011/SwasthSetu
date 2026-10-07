import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { patientApi } from '../services/patientApi';

const QUICK_PROMPTS = [
  'What does my Hemoglobin result mean?',
  'Are my Platelets and WBC count normal?',
  'Can Dr. Mehta see this report when I revisit?',
  'What does a LOW or HIGH flag indicate?',
];

export function AssistantScreen() {
  const { patient } = usePatient();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [contextReport, setContextReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch latest published report to ground answers
    const init = async () => {
      const reports = await patientApi.getPublishedReports(patient.id);
      if (reports.length > 0) {
        setContextReport(reports[0]);
      }

      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Namaste ${patient.name.split(' ')[0]}! I am your VaaniDoc Health Assistant. I can explain Complete Blood Count (CBC) terminology, normal reference ranges, and results from your published laboratory reports.`,
          isSafetyNotice: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    };
    init();
  }, [patient]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await patientApi.queryAssistant(query, contextReport);
      const botMsg = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        isSafetyNotice: res.isSafetyNotice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the assistant right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in page-reading-container" style={{ maxWidth: 840, padding: '8px 0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-900)' }}>
            CBC Health Assistant
          </h2>
          <span className="status-pill active" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
            Educational Only
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
          Answers grounded strictly in your published CBC laboratory data
        </p>
      </div>

      {/* Grounding Status Indicator */}
      {contextReport && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'var(--teal-50)',
          borderRadius: 8,
          fontSize: '0.74rem',
          color: 'var(--teal-900)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          border: '1px solid var(--teal-200)',
        }}>
          <Sparkles size={13} color="var(--teal-600)" />
          <span>Grounded in report: <strong>{contextReport.test_type} ({contextReport.laboratory_name})</strong></span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '8px 4px',
        marginBottom: 12,
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 8,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
              }}
            >
              {!isUser && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--teal-100)',
                  color: 'var(--teal-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 4,
                }}>
                  <Bot size={18} />
                </div>
              )}

              <div style={{
                backgroundColor: isUser ? 'var(--blue-600)' : msg.isSafetyNotice ? '#fff7ed' : '#ffffff',
                color: isUser ? '#ffffff' : 'var(--slate-800)',
                border: isUser ? 'none' : msg.isSafetyNotice ? '1px solid #fed7aa' : '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                boxShadow: isUser ? '0 2px 8px rgba(29, 78, 216, 0.2)' : 'var(--shadow-sm)',
              }}>
                {msg.isSafetyNotice && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c2410c', fontWeight: 700, fontSize: '0.78rem', marginBottom: 4 }}>
                    <ShieldAlert size={14} /> Clinical Safety Notice
                  </div>
                )}
                <div>{msg.text}</div>
                <div style={{
                  fontSize: '0.68rem',
                  color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--slate-400)',
                  marginTop: 6,
                  textAlign: 'right',
                }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="var(--teal-700)" />
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '10px 14px', fontSize: '0.84rem', color: 'var(--slate-500)' }}>
              Checking laboratory reference standards...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Question Prompts */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '0.74rem',
              padding: '6px 10px',
              borderRadius: 20,
              flexShrink: 0,
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="text"
          placeholder="Ask about CBC markers, reference ranges..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border-medium)',
            fontSize: '0.9rem',
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !inputText.trim()}
          style={{ padding: '10px 16px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
