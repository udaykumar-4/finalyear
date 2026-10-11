import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Pill,
  Download,
  Stethoscope,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { reportService, PatientReportData } from '../../services/reportService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const PatientReportsPage: React.FC = () => {
  const [report, setReport] = useState<PatientReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportService.getMyReport()
      .then(setReport)
      .catch((err) => setError(err.message || 'Failed to load medical records.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownload = () => {
    if (!report) return;
    const content = `
AYURSUTRA MEDICAL HEALTH SUMMARY
Patient: ${report.user?.full_name || 'Patient'}
Email: ${report.user?.email}
Generated: ${new Date().toLocaleString()}
--------------------------------------------------
PRESCRIPTIONS ISSUED:
${report.prescriptions?.map((p) => `- ${p.treatment} (${p.duration} sessions): ${p.plan || 'Standard'}`).join('\n') || 'None'}

CLINICAL NOTES:
${report.notes?.map((n) => `- ${new Date(n.createdAt || '').toLocaleDateString()}: ${n.note}`).join('\n') || 'None'}

APPOINTMENT HISTORY:
${report.appointments?.map((a) => `- ${new Date(a.appointment_date).toLocaleDateString()}: ${a.treatment} (${a.status})`).join('\n') || 'None'}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AyurSutra_Medical_Record_${report.user?.full_name || 'Patient'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            My Clinical Records & Prescriptions
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Verified physician charts, official prescription courses, and diagnostic observations
          </p>
        </div>
        <Button variant="primary" onClick={handleDownload} leftIcon={<Download size={16} />}>
          Export Full Record
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Prescriptions */}
      <Card title="Prescriptions Issued" subtitle="Active and completed therapeutic regimens">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {report?.prescriptions && report.prescriptions.map((p) => (
            <div
              key={p._id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-slate-200)',
                backgroundColor: 'var(--color-white)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  {p.treatment}
                </span>
                <span className={`badge ${p.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {p.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)' }}>
                Duration: <strong>{p.duration} sessions</strong> ({p.progressCompleted || 0} completed)
              </div>
              {p.plan && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                  {p.plan}
                </p>
              )}
            </div>
          ))}
          {(!report?.prescriptions || report.prescriptions.length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)' }}>
              No prescriptions on file.
            </div>
          )}
        </div>
      </Card>

      {/* Clinical Notes */}
      <Card title="Doctor Diagnostic Notes" subtitle="Physician observations recorded during consultations">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {report?.notes && report.notes.map((n) => (
            <div
              key={n._id}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-slate-50)',
                border: '1px solid var(--color-slate-200)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)', lineHeight: 1.5 }}>
                {n.note}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', marginTop: '0.375rem' }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Consultation'}
              </div>
            </div>
          ))}
          {(!report?.notes || report.notes.length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)' }}>
              No diagnostic notes recorded yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PatientReportsPage;
