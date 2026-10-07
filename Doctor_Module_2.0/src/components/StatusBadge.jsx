import React from 'react';
import { Sparkles, History, Clock, Eye, DoorOpen, CheckCircle } from 'lucide-react';

export const StatusBadge = ({ type, text }) => {
  const norm = (type || text || '').toUpperCase();

  if (norm === 'NEW') {
    return (
      <span className="badge badge-new">
        <Sparkles size={12} />
        NEW
      </span>
    );
  }

  if (norm === 'REVISITING') {
    return (
      <span className="badge badge-revisiting">
        <History size={12} />
        REVISITING
      </span>
    );
  }

  if (norm === 'WAITING') {
    return (
      <span className="badge badge-waiting">
        <Clock size={12} />
        Waiting
      </span>
    );
  }

  if (norm === 'DOCTOR_REVIEWING' || norm === 'REVIEWING') {
    return (
      <span className="badge badge-reviewing">
        <Eye size={12} />
        Reviewing
      </span>
    );
  }

  if (norm === 'PLEASE_COME_IN' || norm === 'IN_CONSULTATION') {
    return (
      <span className="badge badge-calling">
        <DoorOpen size={12} />
        Called In
      </span>
    );
  }

  if (norm === 'COMPLETED' || norm === 'CLOSED' || norm === 'CONSULTATION_COMPLETED') {
    return (
      <span className="badge badge-completed">
        <CheckCircle size={12} />
        Completed
      </span>
    );
  }

  return <span className="badge badge-completed">{text || type}</span>;
};
