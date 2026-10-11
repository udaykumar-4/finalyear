import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription } from '../../types/prescription';
import Card from '../../components/common/Card';

export const PatientTreatmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    prescriptionService.getByPatientId(user._id)
      .then(setPrescriptions)
      .catch((err) => setError(err.message || 'Failed to load treatment journey.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];
  const completedCount = activeRx?.progressCompleted || 0;
  const duration = activeRx?.duration || 7;
  const pct = Math.min(100, Math.round((completedCount / duration) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          My Panchakarma Treatment Journey
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Personalized therapeutic stages, session timelines, and physician Pathya guidance
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

      {activeRx ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Protocol Card */}
          <Card title={`${activeRx.treatment} Program`} subtitle={`Prescribed by Dr. ${typeof activeRx.doctorId === 'object' ? activeRx.doctorId.full_name : 'Physician'}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                    Session Progress: {completedCount} of {duration} Concluded
                  </span>
                  <span className="badge badge-success">{pct}% Completed</span>
                </div>
                <div style={{ height: '10px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-forest)', transition: 'width 0.4s' }} />
                </div>
              </div>

              {/* 3 Phases Detailed */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: pct < 30 ? 'var(--color-sage)' : 'var(--color-slate-50)',
                  }}
                >
                  <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Stage 1</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    Purvakarma (Preparatory)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Snehana (internal/external oleation) and Swedana (sudation) to liquefy deep doshic toxins.
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: pct >= 30 && pct < 85 ? 'var(--color-sage)' : 'var(--color-slate-50)',
                  }}
                >
                  <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Stage 2</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    Pradhanakarma (Primary)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Main Shodhana evacuation therapy (e.g. Basti / Virechana) targeting deep biological roots.
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: pct >= 85 ? 'var(--color-sage)' : 'var(--color-slate-50)',
                  }}
                >
                  <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Stage 3</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    Paschatkarma (Restorative)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Graduated dietary regimen (Peya, Vilepi, Yusha) and Rasayana for permanent tissue rejuvenation.
                  </p>
                </div>
              </div>

              {/* Instructions and Plan */}
              {activeRx.plan && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-slate-200)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '0.25rem' }}>
                    Clinical Treatment Plan:
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', lineHeight: 1.5 }}>
                    {activeRx.plan}
                  </div>
                </div>
              )}

              {activeRx.notes && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning-border)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                    Physician Pathya & Lifestyle Guidelines:
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)', lineHeight: 1.5 }}>
                    {activeRx.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card padding="lg">
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-slate-400)' }}>
            No active Panchakarma program currently recorded. Schedule a consultation to begin your regimen.
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientTreatmentsPage;
