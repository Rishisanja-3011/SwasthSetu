import React, { useState, useEffect } from 'react';
import LabNavbar from './components/LabNavbar';
import LabSidebar from './components/LabSidebar';
import LabDashboardView from './components/LabDashboardView';
import PatientVisitView from './components/PatientVisitView';
import ReportDetailView from './components/ReportDetailView';
import LabProfileModal from './components/LabProfileModal';
import LabLoginView from './components/LabLoginView';

const DEFAULT_STAFF = {
  id: 'staff-01',
  name: 'Dr. Shalini Gupta',
  role: 'Senior Hematopathologist',
  qualification: 'MBBS, MD Pathology',
  license: 'MED-PATH-9021',
};

export default function App() {
  // Navigation & Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'patient_visit' | 'reports'

  // Lab & Dashboard Data
  const [lab, setLab] = useState(null);
  const [activeStaff, setActiveStaff] = useState(DEFAULT_STAFF);
  const [metrics, setMetrics] = useState({
    activeGrantsCount: 1,
    processingCount: 0,
    needsReviewCount: 0,
    publishedCount: 0,
  });
  const [worklist, setWorklist] = useState([]);
  const [allReportsList, setAllReportsList] = useState([]);

  // Active Visit & Report Data
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [identityData, setIdentityData] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [observations, setObservations] = useState([]);

  // Processing & Publishing Flags
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals & Banners
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'teal') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load Initial Lab & Dashboard Data
  const loadDashboard = async () => {
    try {
      const listRes = await fetch('/api/lab/list');
      const listData = await listRes.json();
      if (listData.success && listData.laboratories.length > 0) {
        const activeLab = listData.laboratories[0];
        setLab(activeLab);

        const dashRes = await fetch(`/api/lab/dashboard/${activeLab._id}`);
        const dashData = await dashRes.json();
        if (dashData.success) {
          setMetrics(dashData.metrics);
          setWorklist(dashData.worklist || []);
          setAllReportsList(dashData.reports || []);

          // If no active grant is selected, pick the first active one
          if (!selectedGrant && dashData.worklist?.length > 0) {
            const firstActive = dashData.worklist.find((g) => g.grant_status === 'ACTIVE') || dashData.worklist[0];
            setSelectedGrant(firstActive);
            loadGrantDetails(firstActive, dashData.reports || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  // Load details for a selected grant (identity + existing report if present)
  const loadGrantDetails = async (grant, reportsList = allReportsList) => {
    if (!grant) return;
    const grantId = grant.grant_id || grant._id;

    // 1. Fetch patient identity if grant is active
    if (grant.grant_status === 'ACTIVE') {
      try {
        const res = await fetch(`/api/lab/grant/${grantId}/patient-identity`);
        const data = await res.json();
        if (data.success) {
          setIdentityData(data);
        } else {
          setIdentityData(null);
        }
      } catch (err) {
        console.error('Error fetching identity:', err);
      }
    } else {
      setIdentityData(null);
    }

    // 2. Check if a report already exists for this grant / patient
    try {
      const reportId = grant.published_report?._id || grant.published_report;
      let matchedReport = null;

      if (reportId) {
        matchedReport = reportsList.find((r) => r._id === reportId);
      } else if (grant.patient?.name) {
        matchedReport = reportsList.find((r) => r.patient_id?.name === grant.patient?.name || r.patient_id === grant.patient?.id);
      }

      if (matchedReport) {
        const repRes = await fetch(`/api/lab/report/${matchedReport._id}`);
        const repData = await repRes.json();
        if (repData.success) {
          setCurrentReport(repData.report);
          setObservations(repData.observations || []);
          return;
        }
      }

      // If no report found yet for this active visit
      if (grant.grant_status === 'ACTIVE') {
        setCurrentReport(null);
        setObservations([]);
      }
    } catch (err) {
      console.error('Error loading report for grant:', err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Action: Open a visit from the Dashboard Worklist
  const handleOpenPatientVisit = async (grant) => {
    setSelectedGrant(grant);
    await loadGrantDetails(grant);
    setCurrentView('patient_visit');
  };

  // Action: Open a report from the Dashboard Worklist
  const handleOpenReport = async (grant) => {
    setSelectedGrant(grant);
    await loadGrantDetails(grant);
    setCurrentView('reports');
  };

  // Action: Upload Generated Blood Report & Run CBC Extraction Engine
  const handleUploadReport = async ({ fileName, caseType = 'standard', rawText = null }) => {
    if (!selectedGrant) return;
    setIsProcessing(true);

    try {
      const grantId = selectedGrant.grant_id || selectedGrant._id;
      const res = await fetch('/api/lab/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_id: grantId,
          case_type: caseType,
          file_name: fileName || 'CBC_Report_Rahul_Sharma.pdf',
          raw_text: rawText,
          technician: activeStaff,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentReport(data.report);
        setObservations(data.observations || []);

        if (data.needs_review) {
          showNotification('CBC Extracted: One or more parameters require pathologist review before publication.', 'warning');
        } else {
          showNotification('Report Uploaded & Extracted: CBC observations validated and ready for review.', 'teal');
        }

        await loadDashboard();
        // Immediately navigate to extraction review in Reports view
        setCurrentView('reports');
      } else {
        showNotification(data.error || 'Failed to process uploaded report.', 'warning');
      }
    } catch (err) {
      showNotification('Error connecting to extraction engine.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Update & deterministically revalidate an extracted observation (Screen #5)
  const handleUpdateObservation = async (obsId, updatedFields) => {
    try {
      const res = await fetch(`/api/lab/observation/${obsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedFields,
          technician: activeStaff,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setObservations((prev) =>
          prev.map((o) => (o._id === obsId ? data.observation : o))
        );

        if (currentReport) {
          setCurrentReport((prev) => ({
            ...prev,
            status: data.report_status,
          }));
        }

        showNotification('Observation corrected and deterministically verified!', 'teal');
        await loadDashboard();
      } else {
        showNotification(data.error || 'Failed to update observation.', 'warning');
      }
    } catch (err) {
      showNotification('Error updating observation.', 'warning');
    }
  };

  // Action: Publish CBC Report to VaaniDoc (Screen #6 -> Screen #7)
  const handlePublishReport = async (signOffNotes) => {
    if (!currentReport) return;
    setIsPublishing(true);

    try {
      const grantId = selectedGrant?.grant_id || selectedGrant?._id;
      const res = await fetch(`/api/lab/report/${currentReport._id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_id: grantId,
          technician: activeStaff,
          sign_off_notes: signOffNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentReport(data.report);
        if (selectedGrant) {
          setSelectedGrant((prev) => ({
            ...prev,
            grant_status: 'EXPIRED',
          }));
        }
        showNotification('Report published successfully! Bounded access expired automatically.', 'teal');
        await loadDashboard();
      } else {
        showNotification(data.error || 'Publication blocked.', 'warning');
      }
    } catch (err) {
      showNotification('Error publishing report.', 'warning');
    } finally {
      setIsPublishing(false);
    }
  };

  // Action: Reset Demo environment
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/seed/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('Demo environment reset successfully! Rahul Sharma CBC order active.', 'teal');
        setCurrentReport(null);
        setObservations([]);
        setSelectedGrant(null);
        setIdentityData(null);
        setCurrentView('dashboard');
        await loadDashboard();
      }
    } catch (err) {
      showNotification('Failed to reset demo.', 'warning');
    }
  };

  // Derive Current Access Status:
  // ACTIVE if the selected grant is ACTIVE and its report is not published
  const isAccessActive = selectedGrant?.grant_status === 'ACTIVE' && currentReport?.status !== 'PUBLISHED';
  const accessStatus = isAccessActive ? 'ACTIVE' : 'EXPIRED';

  // If user is logged out, render Screen #1: Lab Login
  if (!isLoggedIn) {
    return (
      <LabLoginView
        lab={lab}
        onLogin={(staff) => {
          setActiveStaff((prev) => ({ ...prev, ...staff }));
          setIsLoggedIn(true);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <LabNavbar
        lab={lab}
        accessStatus={accessStatus}
        onResetDemo={handleResetDemo}
      />

      <div className="shell-body">
        {/* Left Sidebar */}
        <LabSidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={() => setIsLoggedIn(false)}
          counts={{
            pendingVisits: metrics?.activeGrantsCount || 0,
            needsReview: metrics?.needsReviewCount || 0,
          }}
        />

        {/* Main Content Area */}
        <main className="main-canvas">
          {/* Notification Banner */}
          {notification && (
            <div className={`info-banner ${notification.type}`} style={{ marginBottom: '1.25rem' }}>
              <span>{notification.msg}</span>
            </div>
          )}

          {/* VIEW 1: DASHBOARD (Screen #2) */}
          {currentView === 'dashboard' && (
            <LabDashboardView
              metrics={metrics}
              worklist={worklist}
              onOpenPatientVisit={handleOpenPatientVisit}
              onOpenReport={handleOpenReport}
            />
          )}

          {/* VIEW 2: PATIENT VISIT / VERIFICATION (Screen #3) */}
          {currentView === 'patient_visit' && (
            <PatientVisitView
              identityData={identityData}
              onUploadReport={handleUploadReport}
              isProcessing={isProcessing}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          )}

          {/* VIEW 3: REPORTS (Screen #4, #5, #6, #7) */}
          {currentView === 'reports' && (
            <ReportDetailView
              report={currentReport}
              observations={observations}
              patient={selectedGrant?.patient || identityData?.identity || { name: 'Rahul Sharma' }}
              order={selectedGrant?.diagnostic_order || identityData?.order}
              grantStatus={accessStatus}
              isProcessing={isProcessing}
              isPublishing={isPublishing}
              onUploadReport={handleUploadReport}
              onUpdateObservation={handleUpdateObservation}
              onPublishReport={handlePublishReport}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onResetDemo={handleResetDemo}
              activeStaff={activeStaff}
            />
          )}
        </main>
      </div>

      {/* Lab Profile Modal Dialog */}
      <LabProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        lab={lab}
      />
    </div>
  );
}
