import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labApi } from '../../services/labApi';
import {
  Search,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  Calendar,
  User,
  ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import './LabPatientSearch.css';

export function LabPatientSearch() {
  const navigate = useNavigate();
  const { currentLab } = useAuth();
  const [patientIdInput, setPatientIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);

  const isApproved = currentLab?.admin_approval_status === 'APPROVED';

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!patientIdInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearchResult(null);

      const res = await labApi.searchPatient(patientIdInput, currentLab);

      if (res.success) {
        setSearchResult(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('An unexpected error occurred during patient lookup.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (id) => {
    setPatientIdInput(id);
    setError(null);
    setSearchResult(null);
  };

  return (
    <div className="lab-patient-search-view animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Patient Identity Lookup</h1>
        <p className="page-subtitle">
          Query the platform central patient registry by unique Patient ID (e.g. PX123456).
        </p>
      </div>

      {!isApproved && (
        <div className="search-blocked-banner">
          <ShieldAlert size={20} />
          <div>
            <strong>Lookup Blocked:</strong> Your laboratory account is currently {currentLab?.admin_approval_status}.
            Platform administration approval is required before querying patient identities.
          </div>
        </div>
      )}

      <div className="search-layout-grid">
        <div className="search-form-col">
          <Card>
            <CardHeader>
              <CardTitle>Central Platform Query</CardTitle>
              <CardDescription>
                Search strictly resolves identity-confirmation attributes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="patient-search-form">
                <div className="search-input-wrap">
                  <Search size={18} className="search-field-icon" />
                  <input
                    type="text"
                    className="search-input-field mono"
                    placeholder="Enter Patient ID (e.g. PX123456)"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value.toUpperCase())}
                    disabled={!isApproved}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={!patientIdInput.trim() || !isApproved}
                  >
                    Search
                  </Button>
                </div>

                {/* Quick Select Helpers for Testing */}
                <div className="test-ids-row">
                  <span className="test-lbl">Quick Demo IDs:</span>
                  <button
                    type="button"
                    className="demo-id-chip"
                    onClick={() => handleQuickSelect('PX123456')}
                  >
                    PX123456 (Rahul S.)
                  </button>
                  <button
                    type="button"
                    className="demo-id-chip"
                    onClick={() => handleQuickSelect('PX789012')}
                  >
                    PX789012 (Priya V.)
                  </button>
                  <button
                    type="button"
                    className="demo-id-chip"
                    onClick={() => handleQuickSelect('PX456789')}
                  >
                    PX456789 (Ananya P.)
                  </button>
                  <button
                    type="button"
                    className="demo-id-chip warn"
                    onClick={() => handleQuickSelect('PX999999')}
                  >
                    PX999999 (Non-existent)
                  </button>
                </div>
              </form>

              {/* Error Box */}
              {error && (
                <div className="search-error-box animate-fade-in">
                  <AlertCircle size={18} />
                  <div className="error-text">
                    <strong>Lookup Failed:</strong> {error}
                  </div>
                </div>
              )}

              {/* Minimal Search Result (Strictly Section 10.3 compliant) */}
              {searchResult && (
                <div className="minimal-result-card animate-fade-in">
                  <div className="result-header">
                    <div className="result-status-tag">
                      <UserCheck size={16} />
                      <span>Patient Found</span>
                    </div>
                    <span className="minimal-disclaimer-pill">Minimal Identity Confirmation</span>
                  </div>

                  <div className="minimal-fields-list">
                    <div className="minimal-field-row">
                      <span className="field-lbl">Patient Platform ID:</span>
                      <span className="field-val mono id-highlight">{searchResult.patient_id}</span>
                    </div>
                    <div className="minimal-field-row">
                      <span className="field-lbl">Masked Full Name:</span>
                      <span className="field-val strong-val">{searchResult.name}</span>
                    </div>
                    <div className="minimal-field-row">
                      <span className="field-lbl">Date of Birth (DOB):</span>
                      <span className="field-val">{searchResult.dob}</span>
                    </div>
                    <div className="minimal-field-row">
                      <span className="field-lbl">Gender:</span>
                      <span className="field-val">{searchResult.gender}</span>
                    </div>
                    {searchResult.bloodGroup && (
                      <div className="minimal-field-row">
                        <span className="field-lbl">Reported Blood Group:</span>
                        <span className="field-val">{searchResult.bloodGroup}</span>
                      </div>
                    )}
                  </div>

                  <div className="result-action-bar">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/lab/patients/${searchResult.patient_id}/verify`)}
                      icon={<ArrowRight size={16} />}
                    >
                      Continue to Visit / Verify Consent
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Boundary Notice Sidebar */}
        <div className="search-privacy-sidebar">
          <Card>
            <CardHeader>
              <CardTitle className="privacy-title">
                <ShieldCheck size={18} className="shield-icon" />
                Section 10.3 Privacy Boundary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="privacy-explanation">
                <p>
                  <strong>Search results are intentionally minimal:</strong>
                </p>
                <div className="restricted-items-box">
                  <span className="restricted-badge">Phone Number Hidden</span>
                  <span className="restricted-badge">Residential Address Hidden</span>
                  <span className="restricted-badge">Medical History Hidden</span>
                  <span className="restricted-badge">Other Labs' Reports Hidden</span>
                </div>
                <p className="privacy-rationale">
                  Laboratories can verify physical patient identity against laboratory registration records without obtaining full medical profiling or cross-lab records.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
