import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  Download,
  Eye,
  FileCheck2,
  Edit3,
  Ban,
  Activity,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { Modal } from '../../components/Modal/Modal';
import './LabReportReview.css';

export function LabReportReview() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { currentLab } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [signatoryName, setSignatoryName] = useState('Dr. Ramesh Ramanathan (Lab Director)');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const loadReport = async () => {
    if (!reportId || !currentLab) return;
    try {
      setLoading(true);
      setError(null);
      const res = await labApi.getReportById(reportId, currentLab.id);
      if (res.success) {
        setReport(res.report);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId, currentLab]);

  const handlePublish = async () => {
    try {
      setActionLoading(true);
      const res = await labApi.publishReport(report.report_id, currentLab.id, signatoryName);
      if (res.success) {
        setReport(res.report);
        setShowPublishModal(false);
        setSuccessBanner('Report successfully published! It is now accessible to the patient on their platform dashboard.');
      } else {
        alert(res.error || 'Publishing failed');
      }
    } catch (err) {
      alert('Error during publication: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) {
      alert('Please specify a withdrawal justification.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await labApi.withdrawReport(report.report_id, currentLab.id, withdrawReason);
      if (res.success) {
        setReport(res.report);
        setShowWithdrawModal(false);
        setSuccessBanner('Report status updated to WITHDRAWN. Audit record preserved.');
      } else {
        alert(res.error || 'Withdrawal failed');
      }
    } catch (err) {
      alert('Error withdrawing report: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="review-loading-view">
        <div className="spinner spinner-primary" />
        <p>Loading structured laboratory observations...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="review-error-view">
        <AlertTriangle size={36} className="error-icon" />
        <h2>Access Blocked / Report Not Found</h2>
        <p>{error || 'Report could not be retrieved.'}</p>
        <Link to="/lab/reports">
          <Button variant="secondary" icon={<ArrowLeft size={16} />}>
            Back to Reports Registry
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = report.status === 'PENDING';
  const isPublished = report.status === 'PUBLISHED';
  const isWithdrawn = report.status === 'WITHDRAWN';

  return (
    <div className="lab-report-review-view animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="review-breadcrumbs">
        <Link to="/lab/reports" className="bc-link">Reports Registry</Link>
        <ChevronRight size={14} className="bc-sep" />
        <span className="bc-curr mono">{report.report_id}</span>
        <ChevronRight size={14} className="bc-sep" />
        <span className="bc-action">Clinical Review</span>
      </div>

      {/* Top Banner Notice */}
      {successBanner && (
        <div className="review-success-banner animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="review-header-bar">
        <div className="header-titles">
          <div className="id-status-row">
            <h1 className="report-main-id mono">{report.report_id}</h1>
            <StatusBadge status={report.status} size="lg" />
            <span className="report-version-badge">Version {report.version}</span>
          </div>
          <h2 className="report-test-title">{report.test_type}</h2>
        </div>

        <div className="header-actions">
          {isPending && (
            <Button
              variant="success"
              size="md"
              icon={<FileCheck2 size={16} />}
              onClick={() => setShowPublishModal(true)}
            >
              Sign-off & Publish to Patient
            </Button>
          )}

          {isPublished && (
            <Button
              variant="secondary"
              size="md"
              icon={<Edit3 size={16} />}
              onClick={() => navigate(`/lab/reports/${report.report_id}/versions`)}
            >
              Issue Correction (v{report.version + 1})
            </Button>
          )}

          {!isWithdrawn && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Ban size={15} />}
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* Specimen and Ingestion Meta Row */}
      <div className="specimen-meta-strip">
        <div className="meta-cell">
          <span className="lbl">Patient Platform ID</span>
          <span className="val mono">{report.patient_id}</span>
        </div>
        <div className="meta-cell">
          <span className="lbl">Patient Name</span>
          <span className="val">{report.patient_masked_name}</span>
        </div>
        <div className="meta-cell">
          <span className="lbl">Visit Authorization ID</span>
          <span className="val mono">{report.visit_id}</span>
        </div>
        <div className="meta-cell">
          <span className="lbl">Collection Timestamp</span>
          <span className="val">{new Date(report.collection_date).toLocaleString()}</span>
        </div>
        <div className="meta-cell">
          <span className="lbl">Originating Facility</span>
          <span className="val">{report.lab_name}</span>
        </div>
      </div>

      <div className="review-content-grid">
        <div className="review-left-col">
          {/* Section 7.4 Structured Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Structured Laboratory Observations (Analyte Battery)</CardTitle>
              <CardDescription>
                Biomarkers parsed from original PDF and validated against standard physiologic reference intervals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="table-responsive">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Biomarker / Test Name</th>
                      <th>Measured Value</th>
                      <th>Units</th>
                      <th>Reference Interval</th>
                      <th>Evaluation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.results && report.results.length > 0 ? (
                      report.results.map((res, idx) => (
                        <tr key={idx} className={`row-status-${res.status.toLowerCase()}`}>
                          <td className="test-name-cell">
                            <strong>{res.test_name}</strong>
                            {res.clinical_note && (
                              <span className="note-subtext">{res.clinical_note}</span>
                            )}
                          </td>
                          <td className="value-cell mono">
                            <span className={`val-highlight ${res.status.toLowerCase()}`}>
                              {res.value}
                            </span>
                          </td>
                          <td className="unit-cell mono">{res.unit}</td>
                          <td className="ref-cell mono">{res.reference_range}</td>
                          <td className="status-cell">
                            <StatusBadge status={res.status} size="sm" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-data-cell">
                          No structured results available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Findings & Patterns (Section 6 & 7.4) */}
          <div className="findings-patterns-block">
            <Card>
              <CardHeader>
                <CardTitle className="findings-title">
                  <Activity size={18} className="activity-icon" />
                  Clinical Findings & Biomarker Correlations
                </CardTitle>
                <CardDescription>
                  Synthesized individual findings generated by Person 1 Clinical Processing Engine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="findings-list">
                  {report.findings && report.findings.length > 0 ? (
                    report.findings.map((f) => (
                      <div key={f.id} className="finding-box">
                        <div className="finding-box-top">
                          <span className="finding-title">{f.title}</span>
                          <span className="finding-badge">{f.severity}</span>
                        </div>
                        <p className="finding-detail">{f.detail}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-sub">No explicit abnormalities detected in individual findings.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="patterns-title">
                  <Sparkles size={18} className="sparkle-icon" />
                  Detected Multi-analyte Patterns
                </CardTitle>
                <CardDescription>
                  Cross-analyte clinical associations detected from combined findings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="patterns-list">
                  {report.patterns && report.patterns.length > 0 ? (
                    report.patterns.map((pat) => (
                      <div key={pat.id} className="pattern-box">
                        <div className="pattern-box-top">
                          <span className="pattern-name">{pat.pattern_name}</span>
                          <span className="pattern-confidence">Confidence: {pat.confidence_level}</span>
                        </div>
                        <div className="pattern-keys-row">
                          <span className="keys-label">Correlating Evidence:</span>
                          {pat.evidence_keys.map((k, i) => (
                            <span key={i} className="evidence-chip mono">{k}</span>
                          ))}
                        </div>
                        <div className="pattern-disclaimer">
                          {pat.disclaimer}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-sub">No multi-analyte clinical pattern matches.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Original PDF Artifact Preservation & Review Signoff */}
        <div className="review-right-col">
          <Card>
            <CardHeader>
              <CardTitle>Original Laboratory Source PDF</CardTitle>
              <CardDescription>
                Preserved immutable document per Section 5 & 12.38
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pdf-artifact-card">
                <div className="pdf-icon-frame">
                  <FileText size={48} className="pdf-big-icon" />
                  <span className="pdf-type-badge">Digital PDF</span>
                </div>
                <div className="pdf-meta-box">
                  <span className="pdf-fname">{report.pdf_filename}</span>
                  <span className="pdf-fsize">{report.pdf_filesize} • Checksum Validated</span>
                </div>
                <div className="pdf-viewer-mock">
                  <div className="mock-sheet">
                    <div className="sheet-hdr">
                      <div className="sheet-logo-mock" />
                      <span className="sheet-lab-name">{report.lab_name}</span>
                    </div>
                    <div className="sheet-line line-wide" />
                    <div className="sheet-line line-med" />
                    <div className="sheet-line line-thin" />
                    <div className="sheet-table-mock">
                      <div className="tbl-row-mock" />
                      <div className="tbl-row-mock" />
                      <div className="tbl-row-mock" />
                    </div>
                  </div>
                  <span className="preview-caption">Original PDF rendering preview</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Metadata details */}
          <Card className="metadata-card">
            <CardHeader>
              <CardTitle>Ingestion Metadata (Layer 4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="meta-pair-list">
                <div className="meta-pair">
                  <span>Acquisition Type:</span>
                  <strong className="mono">{report.processing_metadata?.acquisition_type || 'DIGITAL_PDF'}</strong>
                </div>
                <div className="meta-pair">
                  <span>Extraction Engine:</span>
                  <strong>{report.processing_metadata?.extraction_method || 'DIRECT_TEXT_EXTRACTION'}</strong>
                </div>
                <div className="meta-pair">
                  <span>Optical Confidence:</span>
                  <strong className="mono">{(report.processing_metadata?.ocr_confidence * 100).toFixed(0)}%</strong>
                </div>
                <div className="meta-pair">
                  <span>Parsed Timestamp:</span>
                  <span className="mono">{new Date(report.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sign-off & Publish Confirmation Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Confirm Report Publication"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handlePublish}
              loading={actionLoading}
              icon={<CheckCircle2 size={16} />}
            >
              Authorize & Publish Report
            </Button>
          </>
        }
      >
        <div className="modal-publish-body">
          <p className="modal-explain">
            You are officially publishing report <strong className="mono">{report.report_id}</strong> for patient <strong className="mono">{report.patient_id}</strong>.
          </p>
          <div className="modal-warning-box">
            <CheckCircle2 size={18} className="warn-icon" />
            <p>
              Once published, structured observations, clinical findings, and the original PDF will be visible on the patient's personal dashboard and accessible to doctors granted explicit consent.
            </p>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Authorized Lab Biochemist / Signatory Name</label>
            <input
              type="text"
              className="form-input"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Laboratory Report"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleWithdraw}
              loading={actionLoading}
              icon={<Ban size={16} />}
            >
              Confirm Withdrawal
            </Button>
          </>
        }
      >
        <div className="modal-withdraw-body">
          <p className="modal-explain">
            Per Handbook Section 5: Withdrawn reports are removed from active clinical use while audit and version history remain preserved.
          </p>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Reason for Withdrawal <span className="req">*</span></label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Specimen mislabeling detected at collection site, fresh draw requested."
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
