import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  ShieldCheck,
  Clock,
  Search,
  Eye,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  Ban,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import './LabAuditLogs.css';

export function LabAuditLogs() {
  const { currentLab } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentLab) {
      labApi.getAuditLogs(currentLab.id).then((res) => {
        setLogs(res);
        setLoading(false);
      });
    }
  }, [currentLab]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'searched':
        return <span className="audit-badge searched"><Search size={12} /> Searched</span>;
      case 'viewed':
        return <span className="audit-badge viewed"><Eye size={12} /> Viewed</span>;
      case 'uploaded':
        return <span className="audit-badge uploaded"><UploadCloud size={12} /> Uploaded</span>;
      case 'published':
        return <span className="audit-badge published"><FileCheck2 size={12} /> Published</span>;
      case 'corrected':
        return <span className="audit-badge corrected"><RefreshCw size={12} /> Corrected</span>;
      case 'withdrawn':
        return <span className="audit-badge withdrawn"><Ban size={12} /> Withdrawn</span>;
      default:
        return <span className="audit-badge generic">{action}</span>;
    }
  };

  return (
    <div className="lab-audit-view animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Laboratory Access & Compliance Log</h1>
        <p className="page-subtitle">
          Mandatory audit trail enforced by Handbook Section 8.2 & 12.37 for all patient data access events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <ShieldCheck size={18} className="shield-icon" />
            access_log Table Entries (Actor ID: {currentLab?.id})
          </CardTitle>
          <CardDescription>
            Tamper-evident log of all queries, report ingestions, and patient identity interactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="audit-loading">
              <div className="spinner spinner-primary" />
              <p>Reading access logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="audit-empty">
              <Clock size={36} />
              <p>No logged actions recorded in this session yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target Patient</th>
                    <th>Actor Facility</th>
                    <th>Action Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="mono timestamp-cell">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td className="mono patient-cell">{log.patient_id}</td>
                      <td>{currentLab?.name}</td>
                      <td className="mono details-cell">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
