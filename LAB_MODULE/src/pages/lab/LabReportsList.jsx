import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Clock,
  CheckCircle2,
  RefreshCw,
  Ban,
  Layers
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { ReportCard } from '../../components/ReportCard/ReportCard';
import './LabReportsList.css';

export function LabReportsList() {
  const { currentLab } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    if (!currentLab) return;
    try {
      setLoading(true);
      const data = await labApi.getLabReports(currentLab.id, activeFilter);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentLab, activeFilter]);

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.report_id.toLowerCase().includes(q) ||
      r.patient_id.toLowerCase().includes(q) ||
      r.test_type.toLowerCase().includes(q) ||
      (r.patient_masked_name && r.patient_masked_name.toLowerCase().includes(q))
    );
  });

  const isApproved = currentLab?.admin_approval_status === 'APPROVED';

  return (
    <div className="lab-reports-list-view animate-fade-in">
      <div className="reports-top-bar">
        <div>
          <h1 className="page-title">Laboratory Reports Registry</h1>
          <p className="page-subtitle">
            Repository of all diagnostic reports originating from {currentLab?.name}.
          </p>
        </div>

        <div className="top-action-group">
          <Link to="/lab/reports/upload">
            <Button variant="primary" icon={<UploadCloud size={16} />} disabled={!isApproved}>
              Upload / Attach Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="controls-strip">
        <div className="status-tabs-row">
          <button
            type="button"
            className={`tab-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Reports
          </button>
          <button
            type="button"
            className={`tab-btn pending ${activeFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PENDING')}
          >
            <Clock size={14} />
            Pending Review
          </button>
          <button
            type="button"
            className={`tab-btn published ${activeFilter === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PUBLISHED')}
          >
            <CheckCircle2 size={14} />
            Published
          </button>
          <button
            type="button"
            className={`tab-btn corrected ${activeFilter === 'CORRECTED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('CORRECTED')}
          >
            <RefreshCw size={14} />
            Corrected
          </button>
          <button
            type="button"
            className={`tab-btn withdrawn ${activeFilter === 'WITHDRAWN' ? 'active' : ''}`}
            onClick={() => setActiveFilter('WITHDRAWN')}
          >
            <Ban size={14} />
            Withdrawn
          </button>
        </div>

        <div className="search-filter-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-search-input mono"
            placeholder="Filter by Report ID or Patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="reports-loading-box">
          <div className="spinner spinner-primary" />
          <p>Querying laboratory records...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-empty-box">
          <FileSpreadsheet size={44} className="empty-registry-icon" />
          <h3>No reports matching filter</h3>
          <p>No records found with status "{activeFilter}" for this facility.</p>
          {activeFilter !== 'ALL' && (
            <Button variant="secondary" size="sm" onClick={() => setActiveFilter('ALL')}>
              Show All Reports
            </Button>
          )}
        </div>
      ) : (
        <div className="reports-cards-grid">
          {filteredReports.map((report) => (
            <ReportCard key={report.report_id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
