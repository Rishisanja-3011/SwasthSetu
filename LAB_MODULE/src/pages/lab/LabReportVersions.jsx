import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  History,
  GitBranch,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileCheck2,
  FileText,
  ShieldCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { Modal } from '../../components/Modal/Modal';
import './LabReportVersions.css';

export function LabReportVersions() {
  const { reportId } = useParams();
  const { currentLab } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedAnalyte, setSelectedAnalyte] = useState('');
  const [correctedValue, setCorrectedValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [authorName, setAuthorName] = useState('Dr. Sunita Rao (Consultant Pathologist)');
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const loadReport = async () => {
    if (!reportId || !currentLab) return;
    try {
      setLoading(true);
      setError(null);
      const res = await labApi.getReportById(reportId, currentLab.id);
      if (res.success) {
        setReport(res.report);
        if (res.report.results?.length > 0) {
          setSelectedAnalyte(res.report.results[0].test_name);
          setCorrectedValue(res.report.results[0].value);
        }
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Failed to fetch report version records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId, currentLab]);

  const handleAnalyteSelect = (analyteName) => {
    setSelectedAnalyte(analyteName);
    const item = report.results?.find((r) => r.test_name === analyteName);
    if (item) {
      setCorrectedValue(item.value);
    }
  };

  const handleIssueCorrection = async (e) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      alert('Please specify the mandatory clinical reason for this correction.');
      return;
    }

    try {
      setSubmitting(true);
      const updatedResults = report.results.map((r) => {
        if (r.test_name === selectedAnalyte) {
          return {
            ...r,
            value: parseFloat(correctedValue) || correctedValue,
            clinical_note: `Corrected in v${report.version + 1}: Value revised from ${r.value} to ${correctedValue}.`
          };
        }
        return r;
      });

      const res = await labApi.correctReport(report.report_id, currentLab.id, {
        reason: correctionReason,
        correctedResults: updatedResults,
        authorName
      });

      if (res.success) {
        setReport(res.report);
        setShowCorrectionModal(false);
        setSuccessBanner(`Correction Version v${res.report.version} generated successfully! Audit history preserved.`);
        setCorrectionReason('');
      } else {
        alert(res.error || 'Failed to issue correction');
      }
    } catch (err) {
      alert('Error updating report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="versions-loading">
        <div className="spinner spinner-primary" />
        <p>Loading version lineage...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="versions-error">
        <AlertCircle size={36} className="error-icon" />
        <h2>Version Lineage Unavailable</h2>
        <p>{error}</p>
        <Link to="/lab/reports">
          <Button variant="secondary">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="lab-report-versions-view animate-fade-in">
      <div className="versions-breadcrumbs">
        <Link to="/lab/reports" className="bc-link">Reports Registry</Link>
        <ChevronRight size={14} className="bc-sep" />
        <Link to={`/lab/reports/${report.report_id}/review`} className="bc-link mono">
          {report.report_id}
        </Link>
        <ChevronRight size={14} className="bc-sep" />
        <span className="bc-curr">Version Lineage & Corrections</span>
      </div>

      {successBanner && (
        <div className="success-banner animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      <div className="versions-top-header">
        <div>
          <div className="ver-title-line">
            <h1 className="versions-heading mono">{report.report_id}</h1>
            <span className="ver-current-tag">Current: v{report.version}</span>
            <StatusBadge status={report.status} />
          </div>
          <p className="versions-sub">
            {report.test_type} • Patient <span className="mono">{report.patient_id}</span> ({report.patient_masked_name})
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            icon={<Edit3 size={16} />}
            onClick={() => setShowCorrectionModal(true)}
          >
            Issue Correction (Create v{report.version + 1})
          </Button>
        </div>
      </div>

      <div className="versions-layout-grid">
        {/* Timeline Column */}
        <div className="timeline-col">
          <Card>
            <CardHeader>
              <CardTitle>
                <History size={18} className="timeline-title-icon" />
                Immutable Version History
              </CardTitle>
              <CardDescription>
                Auditable changelog per Handbook Section 5, 8.2 & 12.34 (No silent overwriting)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="version-timeline">
                {report.version_history?.map((ver, idx) => {
                  const isCurrent = ver.version === report.version;
                  return (
                    <div key={idx} className={`timeline-entry ${isCurrent ? 'entry-current' : ''}`}>
                      <div className="timeline-marker">
                        <div className="marker-dot" />
                        {idx < report.version_history.length - 1 && <div className="marker-line" />}
                      </div>
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <div className="version-meta">
                            <span className="v-num">Version {ver.version}</span>
                            <StatusBadge status={ver.status} size="sm" />
                            {isCurrent && <span className="active-tag">Active Platform Copy</span>}
                          </div>
                          <span className="v-time">
                            {new Date(ver.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="timeline-author">
                          <strong>Authorized Signatory:</strong> {ver.author}
                        </div>
                        <div className="timeline-notes">
                          <strong>Revision Justification:</strong> {ver.notes}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Values Snapshot */}
          <Card style={{ marginTop: '1.5rem' }}>
            <CardHeader>
              <CardTitle>Active Version Biomarkers (v{report.version})</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Biomarker</th>
                    <th>Value</th>
                    <th>Units</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results?.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{r.test_name}</strong>
                        {r.clinical_note && <span className="note-subtext">{r.clinical_note}</span>}
                      </td>
                      <td className="mono font-bold">{r.value}</td>
                      <td className="mono">{r.unit}</td>
                      <td className="mono">{r.reference_range}</td>
                      <td>
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Rules & Preservation Info */}
        <div className="rules-col">
          <Card>
            <CardHeader>
              <CardTitle>
                <ShieldCheck size={18} className="shield-icon" />
                Correction Principles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="principles-list">
                <div className="principle-item">
                  <strong>Originating Lab Sole Authority:</strong>
                  <p>Only {currentLab?.name} can author revisions for this report.</p>
                </div>
                <div className="principle-item">
                  <strong>Version Increment:</strong>
                  <p>Each modification increments the revision number (v1 → v2 → v3). Past states are never deleted.</p>
                </div>
                <div className="principle-item">
                  <strong>Audited Justification:</strong>
                  <p>Every revision mandates clinical rationale and signatory metadata recorded in access logs.</p>
                </div>
                <div className="principle-item">
                  <strong>Original Artifact Preserved:</strong>
                  <p>Source laboratory PDF remains retained in storage.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Issue Versioned Correction */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title={`Issue Versioned Correction (v${report.version + 1})`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleIssueCorrection}
              loading={submitting}
              icon={<CheckCircle2 size={16} />}
            >
              Issue v{report.version + 1}
            </Button>
          </>
        }
      >
        <form onSubmit={handleIssueCorrection} className="correction-form">
          <p className="correction-modal-notice">
            Creating a correction will update the report state to <strong>CORRECTED</strong> and publish version <strong>v{report.version + 1}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Select Analyte to Correct</label>
            <select
              className="form-input"
              value={selectedAnalyte}
              onChange={(e) => handleAnalyteSelect(e.target.value)}
            >
              {report.results?.map((r, i) => (
                <option key={i} value={r.test_name}>
                  {r.test_name} (Current: {r.value} {r.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              New Corrected Value <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input mono"
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Clinical Revision Reason / Justification <span className="req">*</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Specimen re-assayed on secondary calibrated analyzer confirming microcytic correction."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pathologist / Signatory Name</label>
            <input
              type="text"
              className="form-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
