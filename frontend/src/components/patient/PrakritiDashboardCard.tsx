import React from 'react';
import { Sparkles, ArrowRight, RotateCcw, Calendar, CheckCircle2 } from 'lucide-react';
import { PrakritiAssessmentRecord } from '../../types/prakriti';
import { PRAKRITI_THEME } from '../../constants/prakritiData';
import Button from '../common/Button';

interface PrakritiDashboardCardProps {
  latestAssessment: PrakritiAssessmentRecord | null;
  onOpenAssessment: (initialMode?: 'intro' | 'quiz' | 'result' | 'history') => void;
  isLoading?: boolean;
}

export const PrakritiDashboardCard: React.FC<PrakritiDashboardCardProps> = ({
  latestAssessment,
  onOpenAssessment,
  isLoading = false,
}) => {
  const isCompleted = !!latestAssessment;
  const assessmentDate = latestAssessment?.createdAt
    ? new Date(latestAssessment.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      style={{
        backgroundColor: '#FAF7F2',
        border: '1.5px solid #D1E0D1',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: '1.75rem',
        boxShadow: '0 4px 12px rgba(30, 63, 43, 0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative leaf background watermarks */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-10px',
          fontSize: '4.5rem',
          opacity: 0.12,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        🪷
      </div>

      {/* Top Tag & Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🌿</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#2D5A3C',
            }}
          >
            AYURVEDIC CONSTITUTION
          </span>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: isCompleted ? '#E8F5E9' : '#F1F5F9',
            color: isCompleted ? '#2E7D32' : '#64748B',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 size={12} />
              Completed
            </>
          ) : (
            'Not Started'
          )}
        </span>
      </div>

      {/* Card Header & Description */}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#1E3F2B',
          marginBottom: '0.25rem',
        }}
      >
        Discover Your Prakriti
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: '#4B5563',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
          maxWidth: '560px',
        }}
      >
        Explore your Ayurvedic constitution through a guided assessment.
      </p>

      {/* Dynamic Results Highlight */}
      {isCompleted && latestAssessment ? (
        <div
          style={{
            backgroundColor: 'var(--color-white, #ffffff)',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🪷</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3F2B' }}>
                {latestAssessment.dominantConstitution}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#5C7C5D',
                backgroundColor: '#EBF2EB',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
              }}
            >
              {latestAssessment.constitutionType}
            </span>
          </div>

          {/* Tri-dosha percentage bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                backgroundColor: PRAKRITI_THEME.vata.light,
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: PRAKRITI_THEME.vata.primary,
                }}
              >
                Vata: {latestAssessment.scores.vata}%
              </span>
            </div>
            <div
              style={{
                backgroundColor: PRAKRITI_THEME.pitta.light,
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: PRAKRITI_THEME.pitta.primary,
                }}
              >
                Pitta: {latestAssessment.scores.pitta}%
              </span>
            </div>
            <div
              style={{
                backgroundColor: PRAKRITI_THEME.kapha.light,
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: PRAKRITI_THEME.kapha.primary,
                }}
              >
                Kapha: {latestAssessment.scores.kapha}%
              </span>
            </div>
          </div>

          {assessmentDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#6B7280',
              }}
            >
              <Calendar size={12} />
              <span>Assessed on {assessmentDate}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {isCompleted ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAssessment('result')}
              rightIcon={<ArrowRight size={14} />}
              style={{
                backgroundColor: '#2D5A3C',
                borderColor: '#2D5A3C',
              }}
            >
              View Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAssessment('quiz')}
              leftIcon={<RotateCcw size={14} />}
              style={{
                color: '#2D5A3C',
                borderColor: '#2D5A3C',
              }}
            >
              Retake Assessment
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => onOpenAssessment('intro')}
            rightIcon={<ArrowRight size={16} />}
            isLoading={isLoading}
            style={{
              backgroundColor: '#2D5A3C',
              borderColor: '#2D5A3C',
            }}
          >
            Start Assessment
          </Button>
        )}
      </div>
    </div>
  );
};

export default PrakritiDashboardCard;
