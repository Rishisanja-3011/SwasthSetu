import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './PatientDialog.css';

export function PatientDialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return createPortal(
    <dialog ref={ref} className="patient-dialog" aria-labelledby="patient-dialog-title" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => {
      if (e.target === e.currentTarget) {
        const box = e.currentTarget.getBoundingClientRect();
        if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) onClose();
      }
    }}>
      <header className="patient-dialog-header">
        <h2 id="patient-dialog-title">{title}</h2>
        <button type="button" className="patient-dialog-close" onClick={onClose} aria-label="Close dialog"><X size={21} /></button>
      </header>
      <div className="patient-dialog-body">{children}</div>
    </dialog>, document.body,
  );
}
