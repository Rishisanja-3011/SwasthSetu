import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Clock,
  KeyRound,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ConsentCard } from '../../components/ConsentCard/ConsentCard';
import { QRScanner } from '../../components/QRScanner/QRScanner';
import './LabPatientVerify.css';

export function LabPatientVerify() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { currentLab } = useAuth();

  const [patient, setPatient] = useState(null);
  const [consentData, setConsentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerifyWidget, setShowVerifyWidget] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    if (!patientId || !currentLab) return;
    try {
      setLoading(true);
      const [patRes, conRes] = await Promise.all([
        labApi.searchPatient(patientId, currentLab),
        labApi.getVisitConsent(patientId, currentLab.id)
      ]);

      if (patRes.success) {
        setPatient(patRes.data);
      }
      setConsentData(conRes.consent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId, currentLab]);

  const handleVerifyConsent = async (method, code) => {
    const res = await labApi.verifyVisitConsent(patientId, currentLab.id, method, code);
    if (res.success) {
      setConsentData(res.consent);
      setShowVerifyWidget(false);
      setFeedbackMsg({
        type: 'success',
        text: `Visit consent verified! Valid until ${new Date(res.consent.expires_at).toLocaleString()}`
      });
    } else {
      throw new Error(res.error);
    }
  };

  const isApproved = consentData?.status === 'APPROVED';

  if (loading) {
    return (
      <div className="verify-loading">
        <div className="spinner spinner-primary" />
        <p>Verifying visit consent records...</p>
      </div>
    );
  }

  return (
    <div className="lab-patient-verify-view animate-fade-in">
      <div className="verify-top-nav">
        <Link to="/lab/patients/search" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Search</span>
        </Link>
        <span className="breadcrumb-div">/</span>
        <span className="breadcrumb-curr mono">{patientId}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Patient Visit Verification & Consent Gate</h1>
        <p className="page-subtitle">
          Verification gate enforced by Section 10.2 & 11 before specimen results can be attached.
        </p>
      </div>

      {feedbackMsg && (
        <div className={`feedback-alert ${feedbackMsg.type} animate-fade-in`}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <div className="verify-grid">
        <div className="verify-main-col">
          {/* Patient Card */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Identity Confirmation</CardTitle>
              <CardDescription>Minimal identity check for specimen labeling</CardDescription>
            </CardHeader>
            <CardContent>
              {patient ? (
                <div className="patient-identity-details">
                  <div className="identity-badge-row">
                    <span className="mono pid-chip">{patient.patient_id}</span>
                    <span className="patient-fullname">{patient.name}</span>
                    <span className="gender-tag">{patient.gender}</span>
                    <span className="dob-tag">DOB: {patient.dob}</span>
                  </div>
                </div>
              ) : (
                <p>No patient record matched.</p>
              )}
            </CardContent>
          </Card>

          {/* Visit Consent Gate Box */}
          <div className="consent-gate-wrapper">
            <h3 className="section-label">Visit Authorization Status</h3>
            <ConsentCard
              consent={consentData}
              patientId={patientId}
              onVerifyClick={() => setShowVerifyWidget(true)}
            />
          </div>

          {/* Interactive QR / OTP verification widget */}
          {(!isApproved || showVerifyWidget) && (
            <Card className="verification-action-card animate-fade-in">
              <CardHeader>
                <CardTitle>
                  <KeyRound size={18} className="title-key-icon" />
                  Authenticate Patient Visit Check-in
                </CardTitle>
                <CardDescription>
                  Patient presents 6-digit OTP or Check-in QR code generated from their mobile portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRScanner
                  patientId={patientId}
                  onVerified={handleVerifyConsent}
                  onCancel={isApproved ? () => setShowVerifyWidget(false) : null}
                />
              </CardContent>
            </Card>
          )}

          {/* Action to proceed when approved */}
          {isApproved && (
            <div className="approved-next-action-card animate-fade-in">
              <div className="action-card-text">
                <h4>Visit Authorization Active</h4>
                <p>
                  Visit consent has been verified for this encounter. You are now authorized to upload and attach laboratory reports for <strong>{patientId}</strong>.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={<UploadCloud size={18} />}
                onClick={() => navigate(`/lab/reports/upload?patientId=${patientId}`)}
              >
                Proceed to Upload Report
              </Button>
            </div>
          )}
        </div>

        {/* Protocol Sidebar */}
        <div className="verify-protocol-sidebar">
          <Card>
            <CardHeader>
              <CardTitle>V1.1 Consent Gate Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="protocol-step-guide">
                <div className="p-step">
                  <div className="p-dot" />
                  <div>
                    <strong>Per-Visit Scope:</strong>
                    <p>Consent applies exclusively to this laboratory visit. It does not grant blanket historical or cross-laboratory access.</p>
                  </div>
                </div>
                <div className="p-step">
                  <div className="p-dot" />
                  <div>
                    <strong>48-Hour Upload Window:</strong>
                    <p>Enables realistic physical lab workflow from morning blood draw to evening batch processing.</p>
                  </div>
                </div>
                <div className="p-step">
                  <div className="p-dot" />
                  <div>
                    <strong>Hard Boundary:</strong>
                    <p>If consent expires or is denied, report attachment is strictly rejected server-side.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
