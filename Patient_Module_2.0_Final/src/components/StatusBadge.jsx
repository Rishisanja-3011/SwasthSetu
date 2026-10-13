import React from 'react';

export function StatusBadge({ status, label, icon: Icon, className = '' }) {
  const normStatus = (status || '').toLowerCase();

  const getStyleClass = () => {
    switch (normStatus) {
      case 'published':
      case 'active':
      case 'normal':
      case 'completed':
      case 'ok':
        return 'active';
      case 'waiting':
      case 'processing':
      case 'under_review':
      case 'doctor_reviewing':
        return 'waiting';
      case 'low':
        return 'low';
      case 'high':
        return 'high';
      case 'expired':
      case 'closed':
        return 'expired';
      case 'danger':
      case 'needs_review':
        return 'danger';
      default:
        return 'active';
    }
  };

  const displayText = label || (status ? status.replace(/_/g, ' ') : 'UNKNOWN');

  return (
    <span className={`status-pill ${getStyleClass()} ${className}`}>
      {Icon && <Icon size={12} />}
      <span>{displayText}</span>
    </span>
  );
}
