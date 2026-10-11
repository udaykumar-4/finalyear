import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Activity,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription } from '../../types/prescription';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

export const TherapistPatientsPage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    prescriptionService.getByTherapistId(user._id)
      .then(setPrescriptions)
      .catch((err) => setError(err.message || 'Failed to load assigned patients.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Derive unique patients
  const patientsMap = new Map();
  prescriptions.forEach((rx) => {
    if (rx.patientId && typeof rx.patientId === 'object') {
      patientsMap.set(rx.patientId._id, {
        patient: rx.patientId,
        treatment: rx.treatment,
        notes: rx.notes,
        progress: rx.progressCompleted,
        total: rx.duration,
      });
    }
  });

  const patientList = Array.from(patientsMap.values());
  const filtered = patientList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      item.patient.full_name.toLowerCase().includes(q) ||
      item.treatment.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Assigned Therapy Patients
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Patients undergoing Panchakarma procedures under your clinical care
        </p>
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

      <Card padding="sm">
        <div style={{ maxWidth: '320px' }}>
          <Input
            placeholder="Search assigned patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Prescribed Procedure</th>
                <th>Course Progress</th>
                <th>Therapist Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      {item.patient.full_name}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success">{item.treatment}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)', fontWeight: 600 }}>
                      Session {item.progress || 0} of {item.total}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                      {item.notes || 'Maintain standard oil warmth and steam timing'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No assigned therapy patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TherapistPatientsPage;
