import React from 'react';
import { Sparkles, History, Clock, Eye, DoorOpen, CheckCircle } from 'lucide-react';

export const StatusBadge = ({ type, status, text, label, icon: CustomIcon, className = '' }) => {
  const norm = (type || status || text || label || '').toUpperCase();

  if (norm === 'NEW') {
    return (
      <span className={`badge badge-new ${className}`}>
        <Sparkles size={12} />
        {label || text || 'NEW'}
      </span>
    );
  }

  if (norm === 'REVISITING') {
    return (
      <span className={`badge badge-revisiting ${className}`}>
        <History size={12} />
        {label || text || 'REVISITING'}
      </span>
    );
  }

  if (norm === 'WAITING') {
    return (
      <span className={`badge badge-waiting ${className}`}>
        <Clock size={12} />
        {label || text || 'Waiting'}
      </span>
    );
  }

  if (norm === 'DOCTOR_REVIEWING' || norm === 'REVIEWING' || norm === 'UNDER_REVIEW') {
    return (
      <span className={`badge badge-reviewing ${className}`}>
        <Eye size={12} />
        {label || text || 'Reviewing'}
      </span>
    );
  }

  if (norm === 'PLEASE_COME_IN' || norm === 'IN_CONSULTATION' || norm === 'CONSULTATION_STARTED') {
    return (
      <span className={`badge badge-calling ${className}`}>
        <DoorOpen size={12} />
        {label || text || (norm === 'PLEASE_COME_IN' ? 'Called In' : 'In Consult')}
      </span>
    );
  }

  if (norm === 'COMPLETED' || norm === 'CLOSED' || norm === 'CONSULTATION_COMPLETED') {
    return (
      <span className={`badge badge-completed ${className}`}>
        <CheckCircle size={12} />
        {label || text || 'Completed'}
      </span>
    );
  }

  return (
    <span className={`badge badge-completed ${className}`}>
      {CustomIcon && <CustomIcon size={12} />}
      {label || text || type || status || 'UNKNOWN'}
    </span>
  );
};
