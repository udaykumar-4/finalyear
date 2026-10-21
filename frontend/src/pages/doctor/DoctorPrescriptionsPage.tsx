import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  X,
  Stethoscope,
  Activity,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { userService } from '../../services/userService';
import { Prescription } from '../../types/prescription';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export interface DoctorPrescriptionsPageProps {
  defaultPatientId?: string;
}

export const DoctorPrescriptionsPage: React.FC<DoctorPrescriptionsPageProps> = ({
  defaultPatientId,
}) => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [therapists, setTherapists] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Issue Rx Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId || '');
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [treatment, setTreatment] = useState('Abhyanga');
  const [duration, setDuration] = useState('7');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [rxData, pData, tData] = await Promise.all([
        prescriptionService.getByDoctorId(user._id),
        userService.getAllUsers('patient'),
        userService.getAllUsers('therapist'),
      ]);
      setPrescriptions(rxData);
      setPatients(pData);
      setTherapists(tData);

      if (!selectedPatientId && pData.length > 0) {
        setSelectedPatientId(pData[0]._id);
      }
      if (!selectedTherapistId && tData.length > 0) {
        setSelectedTherapistId(tData[0]._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (defaultPatientId) {
      setSelectedPatientId(defaultPatientId);
      setIsModalOpen(true);
    }
  }, [defaultPatientId]);

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      await prescriptionService.createPrescription({
        patientId: selectedPatientId,
        doctorId: user._id,
        therapistId: selectedTherapistId,
        treatment,
        duration: parseInt(duration, 10) || 7,
        plan: plan || 'Standard Panchakarma protocol with herbal oil decoctions',
        notes: notes || 'Observe morning appetite and pulse before session',
      });
      setIsModalOpen(false);
      setPlan('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to issue prescription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    const patientName = typeof rx.patientId === 'object' ? rx.patientId.full_name : '';
    return !q || patientName.toLowerCase().includes(q) || rx.treatment.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Panchakarma Treatment Prescriptions
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Issue formalized therapeutic protocols, specify session counts, and assign therapists
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsModalOpen(true);
            setModalError(null);
          }}
          leftIcon={<Plus size={16} />}
        >
          Issue New Prescription
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

      {/* Search */}
      <Card padding="sm">
        <div style={{ maxWidth: '320px' }}>
          <Input
            placeholder="Search by patient or therapy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Assigned Therapy</th>
                <th>Assigned Therapist</th>
                <th>Course Duration</th>
                <th>Protocol Adherence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rx) => {
                const patientName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient Record';
                const therapistName = typeof rx.therapistId === 'object' ? rx.therapistId.full_name : 'Assigned Therapist';
                const pct = Math.min(100, Math.round(((rx.progressCompleted || 0) / rx.duration) * 100));
                return (
                  <tr key={rx._id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>{patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Active Regimen'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">{rx.treatment}</span>
                      {rx.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                          {rx.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', fontWeight: 600 }}>
                        {therapistName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)' }}>
                        <strong>{rx.progressCompleted || 0}</strong> of <strong>{rx.duration}</strong> sessions
                      </div>
                    </td>
                    <td style={{ minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-emerald)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-700)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rx.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {rx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No prescriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Rx Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '560px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.375rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-sage)', color: 'var(--color-forest)' }}>
                  <Pill size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                  Issue Panchakarma Prescription
                </h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-error-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-slate-200)',
                    fontSize: '0.875rem',
                  }}
                  required
                >
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.full_name} ({p.condition || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                  Assigning Panchakarma Therapist
                </label>
                <select
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-slate-200)',
                    fontSize: '0.875rem',
                  }}
                  required
                >
                  {therapists.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.full_name} ({t.designation || 'Therapist'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Therapy Protocol"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="e.g. Vamana, Virechana, Shirodhara"
                  required
                />
                <Input
                  label="Session Count (Days)"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="45"
                  required
                />
              </div>

              <Input
                label="Therapeutic Plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="e.g. 7-day Abhyanga with Mahanarayana taila followed by Swedana"
              />

              <Input
                label="Physician Clinical Instructions & Precautions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pathya diet: Warm water only, avoid direct air conditioning"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Formalize & Issue Rx
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptionsPage;
