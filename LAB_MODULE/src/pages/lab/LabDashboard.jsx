import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ReportCard } from '../../components/ReportCard/ReportCard';
import './LabDashboard.css';

export function LabDashboard() {
  const { currentLab } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentLab) return;
    try {
      setLoading(true);
      const data = await labApi.getLabReports(currentLab.id);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLab]);

  const pendingReports = reports.filter((r) => r.status === 'PENDING');
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED');
  const correctedReports = reports.filter((r) => r.status === 'CORRECTED');

  const isApproved = currentLab?.admin_approval_status === 'APPROVED';

  return (
    <div className="lab-dashboard-view">
      {/* Top Banner & Quick Title */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-title">Laboratory Operations Console</h1>
          <p className="dashboard-sub">
            Contributing laboratory: <strong className="lab-highlight">{currentLab?.name}</strong> • License <span className="mono">{currentLab?.license}</span>
          </p>
        </div>

        <div className="welcome-cta-group">
          <Link to="/lab/patients/search">
            <Button variant="secondary" icon={<Search size={16} />}>
              Lookup Patient
            </Button>
          </Link>
          <Link to="/lab/reports/upload">
            <Button variant="primary" icon={<UploadCloud size={16} />} disabled={!isApproved}>
              Attach New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <FileText size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-number">{reports.length}</span>
            <span className="kpi-label">Total Ingested Reports</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-amber">
            <Clock size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-number">{pendingReports.length}</span>
            <span className="kpi-label">Pending Lab Review</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-number">{publishedReports.length}</span>
            <span className="kpi-label">Published to Patients</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-indigo">
            <RefreshCw size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-number">{correctedReports.length}</span>
            <span className="kpi-label">Versioned Corrections</span>
          </div>
        </div>
      </div>

      {/* Action Prompt / Pending Review Alert */}
      {pendingReports.length > 0 && (
        <div className="pending-review-banner">
          <div className="banner-left">
            <div className="bell-badge">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="banner-heading">
                {pendingReports.length} Report{pendingReports.length > 1 ? 's' : ''} Awaiting Final Laboratory Review
              </h4>
              <p className="banner-text">
                Clinical parsing & pattern detection completed. Sign-off is required before reports become visible on patient dashboards.
              </p>
            </div>
          </div>
          <Link to={`/lab/reports/${pendingReports[0].report_id}/review`}>
            <Button variant="primary" size="sm" icon={<FileCheck2 size={16} />}>
              Review Next ({pendingReports[0].report_id})
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="dashboard-sections-grid">
        {/* Recent Reports Column */}
        <div className="main-reports-col">
          <div className="section-head-bar">
            <div>
              <h3 className="section-title">Active Laboratory Reports</h3>
              <p className="section-desc">Filtered strictly to {currentLab?.name} reports</p>
            </div>
            <Link to="/lab/reports" className="see-all-link">
              <span>View All Reports ({reports.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="empty-panel">
              <div className="spinner spinner-primary" />
              <p>Fetching clinical reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-panel">
              <FileText size={42} className="empty-icon" />
              <h4>No reports submitted yet</h4>
              <p>Start by verifying a patient and attaching your first laboratory report PDF.</p>
              <Link to="/lab/patients/search">
                <Button variant="primary" size="sm">Search Patient</Button>
              </Link>
            </div>
          ) : (
            <div className="recent-reports-list">
              {reports.slice(0, 4).map((report) => (
                <ReportCard key={report.report_id} report={report} />
              ))}
            </div>
          )}
        </div>

        {/* Right Info Sidebar: V1.1 Privacy Model & Quick Workflow */}
        <div className="side-workflow-col">
          <Card>
            <CardHeader>
              <CardTitle>4-Step Ingestion Workflow</CardTitle>
              <CardDescription>Strict handbook protocol compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="workflow-steps">
                <div className="step-item">
                  <div className="step-num">1</div>
                  <div className="step-info">
                    <strong>Search Patient Identity</strong>
                    <span>Lookup PX ID with intentionally minimal identity-check fields only.</span>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num">2</div>
                  <div className="step-info">
                    <strong>Verify Visit Consent Gate</strong>
                    <span>Patient authorizes via check-in OTP or 48-hr QR check-in token.</span>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num">3</div>
                  <div className="step-info">
                    <strong>Upload & Ingestion Pipeline</strong>
                    <span>Digital/Scanned PDF classification, OCR/parsing, pattern extraction.</span>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num">4</div>
                  <div className="step-info">
                    <strong>Lab Review & Publish</strong>
                    <span>Biochemist sign-off publishes report to central patient identity.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="security-rules-card">
            <CardHeader>
              <CardTitle className="sec-title">
                <ShieldCheck size={18} className="sec-icon" />
                V1.1 Authorization Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="rules-bullet-list">
                <li><strong>No Cross-Lab Visibility:</strong> Labs only see reports they generated.</li>
                <li><strong>Gated Uploads:</strong> Unconsented reports are blocked server-side.</li>
                <li><strong>No Silent Overwrite:</strong> Revisions generate new versions (v2, v3).</li>
                <li><strong>Original PDF Preserved:</strong> Source PDF is never replaced or mutated.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
