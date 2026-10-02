// Initial mock data complying with BloodReport V1 & V1.1 specifications

export const INITIAL_LABS = [
  {
    id: 'lab_metro_diag_01',
    name: 'Metro Diagnostics & PathLabs',
    license: 'NABL-2024-8842',
    admin_approval_status: 'APPROVED', // 'PENDING' | 'APPROVED' | 'SUSPENDED'
    address: 'Suite 401, HealthCity Center, Bangalore',
    phone: '+91 80 4123 9900',
    contactPerson: 'Dr. Ramesh Ramanathan (Lab Director)'
  },
  {
    id: 'lab_apex_path_02',
    name: 'Apex Super Specialty Laboratory',
    license: 'NABL-2023-1102',
    admin_approval_status: 'APPROVED',
    address: 'East Wing, Medical Enclave, Delhi NCR',
    phone: '+91 11 2678 3311',
    contactPerson: 'Dr. Sunita Rao'
  },
  {
    id: 'lab_nova_pending_03',
    name: 'Nova BioCare Lab (Pending Approval)',
    license: 'REG-PENDING-994',
    admin_approval_status: 'PENDING',
    address: 'Indiranagar, Bangalore',
    phone: '+91 80 9988 7766',
    contactPerson: 'Karan Mehra'
  }
];

export const INITIAL_PATIENTS = [
  {
    patient_id: 'PX123456',
    fullName: 'Rahul Sharma',
    maskedName: 'Rahul S*****',
    dob: '1995-05-12',
    gender: 'Male',
    bloodGroup: 'O+',
    // Sensitive fields only revealed after patient consent in visit workflow
    phone: '+91 98765 43210',
    email: 'rahul.sharma@example.com'
  },
  {
    patient_id: 'PX789012',
    fullName: 'Priya Verma',
    maskedName: 'Priya V****',
    dob: '1988-11-23',
    gender: 'Female',
    bloodGroup: 'B+',
    phone: '+91 98111 22334',
    email: 'priya.verma@example.com'
  },
  {
    patient_id: 'PX456789',
    fullName: 'Ananya Patel',
    maskedName: 'Ananya P****',
    dob: '2001-08-30',
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+91 97234 56789',
    email: 'ananya.p@example.com'
  }
];

// Initial preloaded reports for the active lab
export const INITIAL_REPORTS = [
  {
    report_id: 'REP-2026-9041',
    patient_id: 'PX123456',
    patient_masked_name: 'Rahul S*****',
    lab_id: 'lab_metro_diag_01',
    lab_name: 'Metro Diagnostics & PathLabs',
    visit_id: 'VIS-9021',
    test_type: 'Complete Blood Count (CBC) with Differential',
    collection_date: '2026-09-28T09:30:00Z',
    created_at: '2026-09-28T14:10:00Z',
    published_at: '2026-09-28T16:45:00Z',
    status: 'PUBLISHED', // 'PENDING' | 'PUBLISHED' | 'CORRECTED' | 'WITHDRAWN'
    version: 1,
    pdf_filename: 'CBC_RahulSharma_PX123456.pdf',
    pdf_filesize: '428 KB',
    processing_metadata: {
      acquisition_type: 'DIGITAL_PDF',
      extraction_method: 'DIRECT_TEXT_EXTRACTION',
      ocr_confidence: 0.99,
      parsed_at: '2026-09-28T14:10:05Z',
      validated_at: '2026-09-28T14:10:08Z'
    },
    results: [
      {
        test_name: 'Hemoglobin (Hb)',
        value: 11.2,
        unit: 'g/dL',
        reference_range: '13.5 - 17.5',
        status: 'LOW',
        clinical_note: 'Subnormal hemoglobin indicative of mild normocytic/microcytic anemia.'
      },
      {
        test_name: 'Total Leukocyte Count (WBC)',
        value: 7800,
        unit: 'cells/mcL',
        reference_range: '4,000 - 11,000',
        status: 'NORMAL',
        clinical_note: 'Total count within healthy physiologic limits.'
      },
      {
        test_name: 'Platelet Count',
        value: 245000,
        unit: '/mcL',
        reference_range: '150,000 - 450,000',
        status: 'NORMAL',
        clinical_note: 'Adequate thrombocyte cellularity.'
      },
      {
        test_name: 'Mean Corpuscular Volume (MCV)',
        value: 76.4,
        unit: 'fL',
        reference_range: '80.0 - 100.0',
        status: 'LOW',
        clinical_note: 'Microcytosis detected.'
      },
      {
        test_name: 'Ferritin (Serum)',
        value: 14.8,
        unit: 'ng/mL',
        reference_range: '24.0 - 336.0',
        status: 'LOW',
        clinical_note: 'Depleted iron stores.'
      },
      {
        test_name: 'Red Blood Cell Count (RBC)',
        value: 4.2,
        unit: 'million/mcL',
        reference_range: '4.5 - 5.9',
        status: 'LOW',
        clinical_note: 'Mild erythropenia.'
      }
    ],
    findings: [
      {
        id: 'F-01',
        title: 'Microcytic Hypochromic Anemia Pattern',
        severity: 'ATTENTION',
        detail: 'Simultaneous subnormal Hemoglobin (11.2 g/dL), low MCV (76.4 fL), and low Serum Ferritin (14.8 ng/mL) correlate with iron deficiency erythropoiesis.'
      },
      {
        id: 'F-02',
        title: 'Preserved White Cell & Platelet Cellularity',
        severity: 'NORMAL',
        detail: 'Total leukocyte count and thrombocyte concentrations remain fully within non-pathologic intervals.'
      }
    ],
    patterns: [
      {
        id: 'PAT-CBC-01',
        pattern_name: 'Iron Deficiency Anemia (Mild)',
        confidence_level: 'HIGH',
        evidence_keys: ['Hemoglobin LOW', 'MCV LOW', 'Ferritin LOW'],
        disclaimer: 'Clinical pattern derived from laboratory observations. Not intended to replace a medical doctor consultation or diagnosis.'
      }
    ],
    version_history: [
      {
        version: 1,
        status: 'PUBLISHED',
        timestamp: '2026-09-28T16:45:00Z',
        author: 'Metro Diagnostics Senior Biochemist',
        notes: 'Initial publication authorized following dual-signoff.'
      }
    ]
  },
  {
    report_id: 'REP-2026-8819',
    patient_id: 'PX789012',
    patient_masked_name: 'Priya V****',
    lab_id: 'lab_metro_diag_01',
    lab_name: 'Metro Diagnostics & PathLabs',
    visit_id: 'VIS-8812',
    test_type: 'Comprehensive Metabolic Panel (CMP) & HbA1c',
    collection_date: '2026-09-29T08:15:00Z',
    created_at: '2026-09-29T11:20:00Z',
    published_at: null,
    status: 'PENDING',
    version: 1,
    pdf_filename: 'CMP_PriyaVerma_PX789012.pdf',
    pdf_filesize: '512 KB',
    processing_metadata: {
      acquisition_type: 'DIGITAL_PDF',
      extraction_method: 'DIRECT_TEXT_EXTRACTION',
      ocr_confidence: 0.98,
      parsed_at: '2026-09-29T11:20:04Z',
      validated_at: '2026-09-29T11:20:07Z'
    },
    results: [
      {
        test_name: 'Fasting Plasma Glucose',
        value: 138,
        unit: 'mg/dL',
        reference_range: '70 - 99',
        status: 'HIGH',
        clinical_note: 'Elevated fasting glycemia.'
      },
      {
        test_name: 'Glycated Hemoglobin (HbA1c)',
        value: 7.2,
        unit: '%',
        reference_range: '4.0 - 5.6',
        status: 'HIGH',
        clinical_note: 'Consistent with diabetic threshold (ADA guidelines >= 6.5%).'
      },
      {
        test_name: 'Creatinine (Serum)',
        value: 0.9,
        unit: 'mg/dL',
        reference_range: '0.6 - 1.2',
        status: 'NORMAL',
        clinical_note: 'Renal clearance intact.'
      },
      {
        test_name: 'Blood Urea Nitrogen (BUN)',
        value: 16,
        unit: 'mg/dL',
        reference_range: '7 - 20',
        status: 'NORMAL',
        clinical_note: 'Normal nitrogen retention.'
      }
    ],
    findings: [
      {
        id: 'F-11',
        title: 'Hyperglycemia / Elevated Glycemic Index',
        severity: 'ATTENTION',
        detail: 'Fasting glucose and HbA1c both exceed standard diagnostic thresholds.'
      }
    ],
    patterns: [
      {
        id: 'PAT-GLU-01',
        pattern_name: 'Persistent Glycemic Elevation / Metabolic Pattern',
        confidence_level: 'HIGH',
        evidence_keys: ['Fasting Glucose HIGH', 'HbA1c HIGH'],
        disclaimer: 'Clinical observation. Requires physician review.'
      }
    ],
    version_history: [
      {
        version: 1,
        status: 'PENDING',
        timestamp: '2026-09-29T11:20:00Z',
        author: 'Metro Lab Ingestion Pipeline',
        notes: 'Under lab biochemist review. Not yet visible to patient.'
      }
    ]
  }
];

// Initial visit consent records
export const INITIAL_VISIT_CONSENTS = [
  {
    id: 'VIS-9021',
    patient_id: 'PX123456',
    lab_id: 'lab_metro_diag_01',
    method: 'qr', // 'qr' | 'otp'
    issued_at: '2026-09-28T09:00:00Z',
    expires_at: '2026-09-30T09:00:00Z', // 48 hr check-in window
    status: 'APPROVED', // 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED'
    linked_report_id: 'REP-2026-9041'
  },
  {
    id: 'VIS-8812',
    patient_id: 'PX789012',
    lab_id: 'lab_metro_diag_01',
    method: 'otp',
    issued_at: '2026-09-29T08:00:00Z',
    expires_at: '2026-10-01T08:00:00Z',
    status: 'APPROVED',
    linked_report_id: 'REP-2026-8819'
  }
];
