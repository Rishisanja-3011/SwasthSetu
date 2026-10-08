import React, { useState } from 'react';
import { X, Check, UserPlus, Shield, Phone, Calendar, UserCheck } from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export function PatientSwitcherModal({ onClose }) {
  const { patient, switchPatient, allPatients } = usePatient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newPhone, setNewPhone] = useState('+91 ');

  const handleCreatePatient = (e) => {
    e.preventDefault();
    if (!newName || !newAge) return;

    const newPatient = {
      id: `pt-custom-${Date.now()}`,
      patient_identifier: `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName.trim(),
      age: parseInt(newAge, 10),
      date_of_birth: `${2026 - parseInt(newAge, 10)}-01-01`,
      gender: newGender,
      phone: newPhone.trim(),
    };

    switchPatient(newPatient);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Patient Identity Profile</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
              Master Universal Record: Central Patient Identifier
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Patient Card */}
        <div style={{
          background: 'linear-gradient(135deg, #e6f7f4 0%, #eff6ff 100%)',
          border: '1px solid var(--teal-200)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--teal-800)',
              backgroundColor: '#ffffff',
              padding: '2px 8px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)'
            }}>
              UNIVERSAL ID: {patient.patient_identifier}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--teal-700)', fontWeight: 600 }}>Active Session</span>
          </div>

          <h2 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', marginBottom: 4 }}>{patient.name}</h2>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.84rem', color: 'var(--slate-600)', marginTop: 8 }}>
            <span>Age: <strong>{patient.age} yrs</strong></span>
            <span>Gender: <strong>{patient.gender}</strong></span>
            <span>Phone: <strong>{patient.phone}</strong></span>
          </div>
        </div>

        {/* Select from Pre-registered Demographics */}
        {!isAdding ? (
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--slate-700)', marginBottom: 10 }}>
              Switch Demo Patient:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {allPatients.map((p) => {
                const isSelected = p.patient_identifier === patient.patient_identifier;
                return (
                  <div
                    key={p.patient_identifier}
                    onClick={() => {
                      switchPatient(p);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: isSelected ? '2px solid var(--teal-500)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--teal-50)' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                        {p.patient_identifier} • {p.age}y • {p.gender}
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--teal-600)" />}
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-secondary btn-block"
              onClick={() => setIsAdding(true)}
              style={{ fontSize: '0.88rem' }}
            >
              <UserPlus size={16} />
              Register New Walk-in Patient
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreatePatient}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>New Patient Registration (Minimal 4 Fields)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                    Gender
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.92rem',
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsAdding(false)}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                Save & Set Active
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
