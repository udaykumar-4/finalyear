import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  BookOpen,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescriptionService';
import { Prescription } from '../../types/prescription';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export interface PatientTreatmentsPageProps {
  onOpenRecommendationModal?: () => void;
}

export const PatientTreatmentsPage: React.FC<PatientTreatmentsPageProps> = ({
  onOpenRecommendationModal,
}) => {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            My Panchakarma Treatment Journey
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Personalized therapeutic stages, session timelines, and physician Pathya guidance
          </p>
        </div>
        {onOpenRecommendationModal && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecommendationModal}
            leftIcon={<Sparkles size={16} />}
          >
            AI Treatment Recommendations
          </Button>
        )}
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

      {/* Discovery Banner for Treatment Recommendations */}
      {onOpenRecommendationModal && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-lg, 14px)',
            backgroundColor: '#FAF7F2',
            border: '1px solid #D5E2D8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E3F2B',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1E3F2B', margin: 0 }}>
                Explore New Panchakarma Therapies
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#4A6B56', margin: '0.125rem 0 0 0' }}>
                Use our AI Treatment Recommendation System to evaluate therapies for symptoms, joint pain, or stress.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRecommendationModal}
            rightIcon={<ArrowRight size={14} />}
          >
            Get Recommendations
          </Button>
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
                    backgroundColor: pct >= 30 && pct < 80 ? 'var(--color-sage)' : 'var(--color-slate-50)',
                  }}
                >
                  <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Stage 2</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    Pradhanakarma (Principal Detox)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Active administration of {activeRx.treatment} to extract accumulated doshas from cellular channels.
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: pct >= 80 ? 'var(--color-sage)' : 'var(--color-slate-50)',
                  }}
                >
                  <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>Stage 3</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    Paschatkarma (Restorative Rejuvenation)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Samsarjana Krama dietary reset, Rasayana replenishment, and rebuilding metabolic Agni.
                  </p>
                </div>
              </div>

              {/* Instructions and Regimen */}
              {activeRx.plan && (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: '0.25rem' }}>
                    Physician Prescribed Regimen (Krama)
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', lineHeight: 1.5 }}>
                    {activeRx.plan}
                  </p>
                </div>
              )}

              {activeRx.notes && (
                <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-sage)', border: '1px solid var(--color-sage-border)', fontSize: '0.8125rem', color: 'var(--color-forest)' }}>
                  <strong>Doctor Clinical Notes:</strong> {activeRx.notes}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card title="Panchakarma Protocol Status">
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-slate-400)' }}>
            <Activity size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-slate-700)' }}>
              No Active Panchakarma Prescription Assigned
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
              Your consulting Ayurvedic physician will prescribe a personalized treatment protocol after your clinical examination.
            </p>
            {onOpenRecommendationModal && (
              <Button
                variant="primary"
                onClick={onOpenRecommendationModal}
                leftIcon={<Sparkles size={16} />}
              >
                Explore Recommended Therapies
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientTreatmentsPage;
