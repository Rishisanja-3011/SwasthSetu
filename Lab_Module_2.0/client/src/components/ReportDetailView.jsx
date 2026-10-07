import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Edit3,
  Lock,
  Send,
  X,
  Clock,
  User,
  UploadCloud,
  Check,
} from 'lucide-react';

export default function ReportDetailView({
  report,
  observations,
  patient,
  order,
  grantStatus,
  isProcessing,
  isPublishing,
  onUploadReport,
  onUpdateObservation,
  onPublishReport,
  onBackToDashboard,
  onResetDemo,
  activeStaff,
}) {
  // Local state for Observation Edit Modal
  const [editingObs, setEditingObs] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editRefLow, setEditRefLow] = useState('');
  const [editRefHigh, setEditRefHigh] = useState('');
  const [editReason, setEditReason] = useState('Manual verification against hematology analyzer display');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Local state for Publish Confirmation Modal (Screen #6)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState(
    'All CBC parameters reviewed against hematology analyzer standards. Ready for clinical consultation.'
  );

  // File upload state for unextracted visits
  const [selectedFile, setSelectedFile] = useState({
    name: 'CBC_Report_Rahul_Sharma.pdf',
    size: '184 KB',
  });
  const [triggerDemoReview, setTriggerDemoReview] = useState(false);

  const hasNeedsReview = observations?.some((o) => o.validation_status === 'NEEDS_REVIEW');
  const unresolvedCount = observations?.filter((o) => o.validation_status === 'NEEDS_REVIEW').length || 0;
  const isPublished = report?.status === 'PUBLISHED';

  // Open edit modal
  const handleStartEdit = (obs) => {
    setEditingObs(obs);
    setEditValue(obs.value);
    setEditUnit(obs.unit);
    setEditRefLow(obs.reference_low ?? '');
    setEditRefHigh(obs.reference_high ?? '');
    setEditReason(
      obs.review_reason
        ? `Corrected: ${obs.review_reason}`
        : 'Confirmed by clinical pathologist review'
    );
  };

  // Submit edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingObs) return;

    setIsSavingEdit(true);
    await onUpdateObservation(editingObs._id, {
      value: parseFloat(editValue),
      unit: editUnit,
      reference_low: editRefLow !== '' ? parseFloat(editRefLow) : null,
      reference_high: editRefHigh !== '' ? parseFloat(editRefHigh) : null,
      edit_reason: editReason,
    });
    setIsSavingEdit(false);
    setEditingObs(null);
  };

  // Confirm publish
  const handleConfirmPublish = async () => {
    await onPublishReport(signOffNotes);
    setIsPublishModalOpen(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        rawFile: file,
      });
    }
  };

  const handleUploadSubmit = () => {
    onUploadReport({
      fileName: selectedFile?.name || 'CBC_Report_Rahul_Sharma.pdf',
      caseType: triggerDemoReview ? 'needs_review_demo' : 'standard',
    });
  };

  // =========================================================================
  // STATE 1: UPLOAD REPORT & PROCESSING (SCREEN #4)
  // If no report has been uploaded/extracted yet for this visit
  // =========================================================================
  if (!report) {
    return (
      <div>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            className="btn-clinical outline"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}
            onClick={onBackToDashboard}
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Report Processing
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload generated laboratory report to initiate CBC extraction pipeline
          </p>
        </div>

        {/* Patient & Order Card */}
        <div className="clinical-card">
          <div className="clinical-card-header">
            <div className="card-title-group">
              <User size={18} color="var(--teal-700)" />
              <h3 className="card-title">Patient & Diagnostic Order</h3>
            </div>
            <span className="badge-pill normal">● Access Active</span>
          </div>

          <div className="identity-cards-grid">
            <div className="identity-field-card">
              <div className="label">Patient Name</div>
              <div className="val">{patient?.name || 'Rahul Sharma'}</div>
            </div>
            <div className="identity-field-card">
              <div className="label">Age & Gender</div>
              <div className="val">{patient?.age || 32} yrs · {patient?.gender || 'Male'}</div>
            </div>
            <div className="identity-field-card">
              <div className="label">Test Type</div>
              <div className="val">Complete Blood Count (CBC)</div>
            </div>
            <div className="identity-field-card">
              <div className="label">Ordering Physician</div>
              <div className="val">Dr. Ramesh Mehta</div>
            </div>
          </div>
        </div>

        {/* Required Upload Blood Report Card */}
        <div className="clinical-card">
          <div className="clinical-card-header">
            <div className="card-title-group">
              <UploadCloud size={18} color="var(--teal-700)" />
              <h3 className="card-title">Upload CBC Report</h3>
            </div>
            <span className="badge-pill neutral">Lab-Side Upload</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Upload the blood report generated by the laboratory.
          </p>

          {isProcessing ? (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div
                className="badge-pill normal"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', marginBottom: '1rem' }}
              >
                <CheckCircle size={15} />
                <span>Report Uploaded Successfully</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Clock size={18} className="animate-spin" color="var(--teal-600)" />
                <span
                  className="badge-pill low"
                  style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.05em' }}
                >
                  PROCESSING
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Extracting text, parsing CBC parameters, and running deterministic validation...
              </p>
            </div>
          ) : (
            <div>
              {/* File Chooser Box */}
              <div
                style={{
                  border: '1.5px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  marginBottom: '1.25rem',
                }}
              >
                <input
                  type="file"
                  id="report-file-input-reports"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="report-file-input-reports"
                    className="btn-clinical outline"
                    style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    <FileText size={16} />
                    <span>Choose Report File</span>
                  </label>
                </div>

                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {selectedFile?.name || 'CBC_Report_Rahul_Sharma.pdf'}
                </div>

                <div style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                  <span className="badge-pill neutral" style={{ fontWeight: 800, fontSize: '0.72rem' }}>
                    PDF
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Original laboratory generated blood report ({selectedFile?.size || '184 KB'})
                </div>
              </div>

              {/* Optional Demo Discrepancy Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-page)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="checkbox"
                  id="toggle-discrepancy-reports"
                  checked={triggerDemoReview}
                  onChange={(e) => setTriggerDemoReview(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="toggle-discrepancy-reports" style={{ cursor: 'pointer' }}>
                  Simulate extraction discrepancy / low-confidence value (Triggers <code>NEEDS_REVIEW</code> to test Pathologist review)
                </label>
              </div>

              {/* Upload Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-clinical primary"
                  onClick={handleUploadSubmit}
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.88rem' }}
                >
                  <UploadCloud size={16} />
                  <span>Upload Report</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2 & 3 & 4: EXTRACTION REVIEW & PUBLISHED STATE (SCREENS #5, #6, #7)
  // When report is uploaded & extracted, view shows Review or Final Published state
  // =========================================================================
  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <button
            className="btn-clinical outline"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}
            onClick={onBackToDashboard}
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {isPublished ? 'Published Report' : 'Extraction Review'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Complete Blood Count (CBC) · Patient: {patient?.name || report?.patient_id?.name || 'Rahul Sharma'}
          </p>
        </div>

        <div>
          {isPublished ? (
            <div className="access-pill expired" title="Laboratory access ended automatically after report publication.">
              <ShieldAlert size={14} />
              <span>● ACCESS EXPIRED</span>
            </div>
          ) : (
            <div className="access-pill active" title="Patient information is temporarily available for this laboratory visit.">
              <ShieldCheck size={14} />
              <span>● ACCESS ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Published Status Banner (Screen #7) */}
      {isPublished && (
        <div className="info-banner success" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--status-normal-text)' }}>
              ✓ Report Published
            </div>
            <div style={{ fontSize: '0.88rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
              The report is now available to the patient in VaaniDoc.
            </div>
            <div
              style={{
                marginTop: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--status-expired-bg)',
                border: '1px solid var(--status-expired-border)',
                color: 'var(--status-expired-text)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <span>ACCESS EXPIRED</span>
            </div>
          </div>
        </div>
      )}

      {/* Needs Review Blocking Banner (Screen #5) */}
      {!isPublished && hasNeedsReview && (
        <div className="info-banner warning" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              NEEDS_REVIEW — Publishing Disabled
            </div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
              One or more observations are marked <code>NEEDS_REVIEW</code>. Per clinical safety rules, publishing is disabled until all flagged observations are reviewed and confirmed/corrected.
            </div>
          </div>
        </div>
      )}

      {/* Preserved Original Report File Notice (Section #5) */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <FileText size={18} color="var(--teal-700)" />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Preserved Original File: <span style={{ fontFamily: 'var(--font-mono)' }}>{report?.original_file_name || 'CBC_Report_Rahul_Sharma.pdf'}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Original laboratory document preserved without modification. Patient can access original report in VaaniDoc.
            </div>
          </div>
        </div>

        <span className="badge-pill neutral" style={{ fontSize: '0.72rem' }}>
          Archived & Unmodified
        </span>
      </div>

      {/* Extracted Observations Table Card */}
      <div className="clinical-card">
        <div className="clinical-card-header">
          <div className="card-title-group">
            <FileText size={18} color="var(--teal-700)" />
            <h3 className="card-title">
              {isPublished ? 'Published CBC Observations' : 'Extracted CBC Observations'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({observations?.length || 0} parameters)
            </span>
          </div>

          <div>
            {isPublished ? (
              <span className="badge-pill normal">
                <Lock size={12} /> Published
              </span>
            ) : hasNeedsReview ? (
              <span className="badge-pill review">
                <AlertTriangle size={12} /> {unresolvedCount} Needs Review
              </span>
            ) : (
              <span className="badge-pill normal">
                <Check size={12} /> All Validated
              </span>
            )}
          </div>
        </div>

        {/* Clean Clinical Observations Table */}
        <div className="table-wrapper">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Test</th>
                <th style={{ textAlign: 'right' }}>Value</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
                {!isPublished && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {observations?.map((obs) => {
                const isItemNeedsReview = obs.validation_status === 'NEEDS_REVIEW';

                // Status Flag badge
                let flagBadge = <span className="badge-pill normal">NORMAL</span>;
                if (obs.flag === 'LOW') {
                  flagBadge = <span className="badge-pill low">LOW</span>;
                } else if (obs.flag === 'HIGH') {
                  flagBadge = <span className="badge-pill high">HIGH</span>;
                }

                return (
                  <tr key={obs._id} className={isItemNeedsReview ? 'highlight-review' : ''}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{obs.test_name_normalized}</strong>
                      {obs.manually_edited && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            backgroundColor: 'var(--teal-50)',
                            border: '1px solid var(--teal-100)',
                            color: 'var(--teal-800)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 'var(--radius-sm)',
                            marginLeft: '0.4rem',
                            fontWeight: 600,
                          }}
                        >
                          Verified
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', textAlign: 'right' }}>
                      {obs.value}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {obs.unit}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {obs.reference_low !== null && obs.reference_high !== null
                        ? `${obs.reference_low} - ${obs.reference_high}`
                        : '—'}
                    </td>
                    <td>
                      {isItemNeedsReview ? (
                        <div>
                          <span className="badge-pill review">NEEDS_REVIEW</span>
                          {obs.review_reason && (
                            <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '0.2rem', maxWidth: '240px' }}>
                              {obs.review_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        flagBadge
                      )}
                    </td>
                    {!isPublished && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-clinical outline"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => handleStartEdit(obs)}
                        >
                          <Edit3 size={12} />
                          <span>{isItemNeedsReview ? 'Fix & Verify' : 'Edit'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pathologist & Action Bar */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Signing Pathologist: <strong>{activeStaff?.name || 'Dr. Shalini Gupta'}</strong> ({activeStaff?.role || 'Senior Hematopathologist'})
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isPublished ? (
              <button className="btn-clinical outline" onClick={onResetDemo}>
                <RotateCcw size={14} />
                <span>Reset Demo Iteration</span>
              </button>
            ) : (
              <button
                className="btn-clinical primary"
                disabled={hasNeedsReview || isPublishing}
                onClick={() => setIsPublishModalOpen(true)}
                title={hasNeedsReview ? 'Resolve all flagged items before publication' : 'Publish report to VaaniDoc'}
                style={{ padding: '0.65rem 1.4rem' }}
              >
                {hasNeedsReview ? (
                  <>
                    <Lock size={15} />
                    <span>Publishing Disabled (Resolve Flagged)</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>PUBLISH REPORT</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Observation Edit Modal Dialog */}
      {editingObs && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <div className="card-title-group">
                <Edit3 size={18} color="var(--teal-700)" />
                <h3 className="card-title">Review & Correct Observation</h3>
              </div>
              <button
                onClick={() => setEditingObs(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {editingObs.test_name_normalized}
              </div>
              {editingObs.review_reason && (
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                  {editingObs.review_reason}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Observed Numeric Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Reason for Correction (Audited)
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-clinical outline"
                  onClick={() => setEditingObs(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clinical primary"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen #6: Publish Confirmation Modal Dialog */}
      {isPublishModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <div className="card-title-group">
                <Send size={18} color="var(--teal-700)" />
                <h3 className="card-title">Publish Report to VaaniDoc</h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div className="info-banner neutral" style={{ marginBottom: '1rem' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>Bounded Access Notice:</strong> Publishing will transmit the Complete Blood Count findings to VaaniDoc. 
                  The laboratory's access to patient identity will terminate automatically upon publication.
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Pathologist Sign-Off Remarks:
              </label>
              <textarea
                rows={2}
                value={signOffNotes}
                onChange={(e) => setSignOffNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-main)',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-clinical outline"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                className="btn-clinical primary"
                disabled={isPublishing}
                onClick={handleConfirmPublish}
              >
                {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
