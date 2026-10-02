import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCw,
  Ban,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import './StatusBadge.css';

export function StatusBadge({ status, type = 'report', size = 'normal', showIcon = true }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'PUBLISHED':
      case 'APPROVED':
        return {
          className: 'badge-published',
          icon: <CheckCircle2 className="badge-icon" size={13} />,
          label: normalized
        };
      case 'PENDING':
        return {
          className: 'badge-pending',
          icon: <Clock className="badge-icon" size={13} />,
          label: 'PENDING'
        };
      case 'CORRECTED':
        return {
          className: 'badge-corrected',
          icon: <RefreshCw className="badge-icon" size={13} />,
          label: 'CORRECTED'
        };
      case 'WITHDRAWN':
        return {
          className: 'badge-withdrawn',
          icon: <Ban className="badge-icon" size={13} />,
          label: 'WITHDRAWN'
        };
      case 'DENIED':
        return {
          className: 'badge-denied',
          icon: <XCircle className="badge-icon" size={13} />,
          label: 'DENIED'
        };
      case 'EXPIRED':
        return {
          className: 'badge-expired',
          icon: <Clock className="badge-icon" size={13} />,
          label: 'EXPIRED'
        };
      case 'SUSPENDED':
        return {
          className: 'badge-suspended',
          icon: <ShieldAlert className="badge-icon" size={13} />,
          label: 'SUSPENDED'
        };
      case 'HIGH':
        return {
          className: 'badge-high',
          icon: <AlertTriangle className="badge-icon" size={13} />,
          label: 'HIGH'
        };
      case 'LOW':
        return {
          className: 'badge-low',
          icon: <AlertTriangle className="badge-icon" size={13} />,
          label: 'LOW'
        };
      case 'NORMAL':
        return {
          className: 'badge-normal',
          icon: <CheckCircle2 className="badge-icon" size={13} />,
          label: 'NORMAL'
        };
      default:
        return {
          className: 'badge-expired',
          icon: null,
          label: normalized
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`status-badge-wrapper ${config.className} size-${size}`}>
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
}
