import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDoctorAuth } from '../context/DoctorAuthContext';
import { PrintableQRStandee } from '../components/PrintableQRStandee';

export const DoctorQRScreen = () => {
  const { doctor } = useDoctorAuth();
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ padding: '8px 0 32px 0' }}>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--slate-600)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Today's Queue</span>
        </button>
      </div>
      <PrintableQRStandee doctor={doctor} />
    </div>
  );
};
