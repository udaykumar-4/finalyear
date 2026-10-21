import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, BookOpen, Activity } from 'lucide-react';
import Button from '../common/Button';

interface TreatmentRecommendationDashboardCardProps {
  onOpenRecommendations: () => void;
}

export const TreatmentRecommendationDashboardCard: React.FC<TreatmentRecommendationDashboardCardProps> = ({
  onOpenRecommendations,
}) => {
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
      {/* Decorative leaf watermark */}
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
        🌿
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
          <span style={{ fontSize: '1.1rem' }}>✦</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#2D5A3C',
            }}
          >
            INTELLIGENT CLINICAL GUIDANCE
          </span>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <Activity size={12} />
          Active System
        </span>
      </div>

      {/* Main Title & Description */}
      <div style={{ maxWidth: '680px', marginBottom: '1.25rem' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#1E3F2B',
            marginBottom: '0.375rem',
          }}
        >
          AI Treatment Recommendation System
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#4A6B56',
            lineHeight: 1.5,
          }}
        >
          Explore personalized Panchakarma therapy options tailored to your presenting symptoms, active doshic imbalances, and clinical health goals.
        </p>
      </div>

      {/* Feature Pillars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            border: '1px solid #E2EBE4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={16} color="#1E3F2B" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B' }}>
              Targeted Therapies
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#5A7A66', margin: 0, lineHeight: 1.4 }}>
            Tailored protocols including Kati Basti, Shirodhara, Nasya, and Patra Pinda Swedana.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            border: '1px solid #E2EBE4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <BookOpen size={16} color="#1E3F2B" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B' }}>
              Classical Evidence
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#5A7A66', margin: 0, lineHeight: 1.4 }}>
            Grounded in authentic Charaka & Ashtanga Hridaya classical Samhita treatment guidelines.
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            border: '1px solid #E2EBE4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="#1E3F2B" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B' }}>
              Safety Validated
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#5A7A66', margin: 0, lineHeight: 1.4 }}>
            Clinical contraindication screening with final prescribing authority reserved for doctors.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderTop: '1px solid #E2EBE4',
          paddingTop: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5A7A66' }}>Common Inquiries:</span>
          {['Back & Spine Care', 'Joint Stiffness', 'Stress & Sleep', 'Digestive Balance'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.6875rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #D5E2D8',
                color: '#2D5A3C',
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={onOpenRecommendations}
          leftIcon={<Sparkles size={16} />}
          rightIcon={<ArrowRight size={16} />}
        >
          Get Treatment Recommendations
        </Button>
      </div>
    </div>
  );
};

export default TreatmentRecommendationDashboardCard;
