import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, User, Eye, Edit3, ArrowUpRight, History } from 'lucide-react';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { Button } from '../Button/Button';
import './ReportCard.css';

export function ReportCard({ report, onReviewClick, onCorrectClick }) {
  if (!report) return null;

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const highCount = report.results?.filter((r) => r.status === 'HIGH').length || 0;
  const lowCount = report.results?.filter((r) => r.status === 'LOW').length || 0;
  const abnormalCount = highCount + lowCount;

  return (
    <div className={`report-card-item status-${report.status.toLowerCase()}`}>
      <div className="report-card-top">
        <div className="report-id-wrapper">
          <FileText size={18} className="report-icon" />
          <span className="report-id mono">{report.report_id}</span>
          {report.version > 1 && (
            <span className="version-pill">v{report.version}</span>
          )}
        </div>
        <StatusBadge status={report.status} />
      </div>

      <div className="report-title-section">
        <h4 className="report-test-title">{report.test_type}</h4>
      </div>

      <div className="report-meta-grid">
        <div className="report-meta-item">
          <User size={14} className="meta-icon" />
          <span className="meta-text">
            {report.patient_masked_name} <span className="mono">({report.patient_id})</span>
          </span>
        </div>
        <div className="report-meta-item">
          <Calendar size={14} className="meta-icon" />
          <span className="meta-text">{formatDate(report.collection_date || report.created_at)}</span>
        </div>
      </div>

      {report.results && report.results.length > 0 && (
        <div className="report-biomarker-summary">
          <span className="summary-count">{report.results.length} Analyzed Biomarkers</span>
          {abnormalCount > 0 ? (
            <span className="summary-alert">
              {abnormalCount} flagged ({highCount} High, {lowCount} Low)
            </span>
          ) : (
            <span className="summary-ok">All biomarkers within reference range</span>
          )}
        </div>
      )}

      <div className="report-actions-row">
        <Link to={`/lab/reports/${report.report_id}`} className="view-details-link">
          <span>View Details</span>
          <ArrowUpRight size={15} />
        </Link>

        <div className="report-btn-group">
          {report.status === 'PENDING' && (
            <Link to={`/lab/reports/${report.report_id}/review`}>
              <Button variant="primary" size="sm">
                Review & Publish
              </Button>
            </Link>
          )}

          {report.status === 'PUBLISHED' && (
            <Link to={`/lab/reports/${report.report_id}/versions`}>
              <Button variant="secondary" size="sm" icon={<History size={14} />}>
                Version History
              </Button>
            </Link>
          )}

          {report.status === 'CORRECTED' && (
            <Link to={`/lab/reports/${report.report_id}/versions`}>
              <Button variant="secondary" size="sm" icon={<History size={14} />}>
                v{report.version} History
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
