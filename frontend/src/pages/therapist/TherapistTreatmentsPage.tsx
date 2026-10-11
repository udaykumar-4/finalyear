import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Flame,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription } from '../../types/prescription';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const TherapistTreatmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTreatments = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await prescriptionService.getByTherapistId(user._id);
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned Panchakarma protocols.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, [user]);

  const handleUpdateProgress = async (rx: Prescription, delta: number) => {
    const nextVal = Math.max(0, Math.min(rx.duration, (rx.progressCompleted || 0) + delta));
    setUpdatingId(rx._id);
    try {
      await prescriptionService.updateProgress(rx._id, nextVal);
      loadTreatments();
    } catch (err: any) {
      alert(err.message || 'Failed to update protocol progress.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageInfo = (progress: number, duration: number) => {
    const pct = (progress / duration) * 100;
    if (pct < 30) {
      return { stage: 'Purvakarma', desc: 'Preparation: Deepana, Pachana, Snehana & Swedana', color: 'badge-info' };
    } else if (pct < 85) {
      return { stage: 'Pradhanakarma', desc: 'Primary Shodhana: Main evacuation therapy', color: 'badge-warning' };
    } else {
      return { stage: 'Paschatkarma', desc: 'Post-therapy: Samsarjana krama & rejuvenation', color: 'badge-success' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Assigned Panchakarma Protocols & Stage Progression
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Track classical three-phase Shodhana therapies (Purvakarma, Pradhanakarma, Paschatkarma) and session logs
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {prescriptions.map((rx) => {
          const patientName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient Record';
          const doctorName = typeof rx.doctorId === 'object' ? rx.doctorId.full_name : 'Doctor';
          const completedCount = rx.progressCompleted || 0;
          const pct = Math.min(100, Math.round((completedCount / rx.duration) * 100));
          const stage = getStageInfo(completedCount, rx.duration);

          return (
            <Card key={rx._id} padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      {patientName}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                      Prescribed by Dr. {doctorName}
                    </span>
                  </div>
                  <span className={`badge ${stage.color}`}>
                    {stage.stage}
                  </span>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-forest)' }}>
                      {rx.treatment}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      {completedCount} / {rx.duration} Sessions
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', lineHeight: 1.4 }}>
                    {stage.desc}
                  </p>
                </div>

                {rx.plan && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', lineHeight: 1.4 }}>
                    <strong>Plan:</strong> {rx.plan}
                  </p>
                )}

                {/* Progress Bar */}
                <div>
                  <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.25rem' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-emerald)', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-slate-500)' }}>
                    <span>Purvakarma</span>
                    <span>Pradhanakarma</span>
                    <span>Paschatkarma ({pct}%)</span>
                  </div>
                </div>

                {/* Progress Stepper Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-slate-100)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
                    Log Session:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={completedCount <= 0 || updatingId === rx._id}
                      onClick={() => handleUpdateProgress(rx, -1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                      {completedCount}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={completedCount >= rx.duration || updatingId === rx._id}
                      onClick={() => handleUpdateProgress(rx, 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {prescriptions.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
            No active therapy protocols assigned.
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistTreatmentsPage;
