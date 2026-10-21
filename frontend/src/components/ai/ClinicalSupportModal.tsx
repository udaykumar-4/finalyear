import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Pill,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { aiService, TreatmentRecommendationResponse } from '../../services/aiService';
import Button from '../common/Button';
import Input from '../common/Input';

export interface ClinicalSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
  onOpenPrescribe?: (patientId: string, initialTreatment?: string, initialDuration?: number) => void;
}

const COMMON_SYMPTOM_PRESETS = [
  { label: '🌿 Lower Back Pain & Sciatica', query: 'Lower back stiffness, radicular lumbar pain, aggravated by prolonged sitting (Kati Shula)' },
  { label: '🦴 Joint Pain & Arthritis', query: 'Chronic knee joint pain, crepitus, morning stiffness, aggravated Vata (Sandhigata Vata)' },
  { label: '🧠 Migraine & Neck Pain', query: 'Throbbing hemicranial headache, cervical stiffness, sensory sensitivity (Cervical Spondylosis)' },
  { label: '🔥 Hyperacidity & Bloating', query: 'Post-prandial heartburn, acid reflux, epigastric heaviness, aggravated Pitta (Amlapitta)' },
  { label: '💆 Stress & Sleep Disturbance', query: 'Nervous exhaustion, difficulty falling asleep, mental restlessness, dry skin (Anidra)' },
  { label: '✨ Panchakarma Detoxification', query: 'Sluggish metabolic Agni, Ama toxin accumulation, body heaviness, seasonal cleansing' },
];

export const ClinicalSupportModal: React.FC<ClinicalSupportModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientCondition,
  onOpenPrescribe,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TreatmentRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate presenting complaints if patient has recorded condition
  useEffect(() => {
    if (isOpen) {
      if (patientCondition && !symptoms) {
        setSymptoms(patientCondition);
      }
      setError(null);
    }
  }, [isOpen, patientCondition]);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const querySymptoms = (symptoms || patientCondition || 'General Panchakarma Consultation').trim();

    try {
      const res = await aiService.generateTreatmentRecommendation(patientId, querySymptoms);
      if (!res.success && res.message && (!res.suggestedOptions || res.suggestedOptions.length === 0)) {
        setError(res.message);
        setResult(null);
      } else {
        setResult(res);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate clinical treatment recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetQuery: string) => {
    setSymptoms(presetQuery);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-slate-200)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF7F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1E3F2B 0%, #10B981 100%)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E3F2B', margin: 0 }}>
                Ayurvedic Clinical Decision Support
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#4A6B56', margin: '0.125rem 0 0 0' }}>
                AI Treatment Protocol Advisory for <strong>{patientName}</strong>
                {patientCondition ? ` • Condition: ${patientCondition}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-slate-400)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '0.625rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#92400E',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={16} color="#D97706" />
          <span>Doctor Supervised Only: AI suggests evidence-based options; physician validation required before prescribing.</span>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Presets */}
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4A6B56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Common Presenting Complaints (or type below):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              {COMMON_SYMPTOM_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPreset(preset.query)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3125rem 0.625rem',
                    borderRadius: '20px',
                    backgroundColor: symptoms === preset.query ? '#E8F5E9' : '#FAF7F2',
                    color: symptoms === preset.query ? '#1E3F2B' : '#334155',
                    border: symptoms === preset.query ? '1.5px solid #10B981' : '1px solid #D5E2D8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Input
              label="Presenting Complaints & Clinical Observations"
              placeholder="e.g. Chronic back pain, morning joint stiffness, dry skin, aggravated Vata"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Sparkles size={16} />}
              style={{ alignSelf: 'flex-start', minWidth: '220px' }}
            >
              {isLoading ? 'Analyzing Clinical Protocol...' : 'Generate Clinical AI Support'}
            </Button>
          </form>

          {/* Error Notice */}
          {error && (
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Contraindication Warnings */}
              {result.contraindicationWarnings && result.contraindicationWarnings.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#991B1B', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <span>Clinical Contraindications & Precautions</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#B91C1C', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                    {result.contraindicationWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Protocol Options */}
              {result.suggestedOptions && result.suggestedOptions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E3F2B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommended Ayurvedic Protocols ({result.suggestedOptions.length})
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#4A6B56', fontWeight: 600 }}>
                      Evidence: {result.uncertainty || 'Classical Standard'}
                    </span>
                  </div>

                  {result.suggestedOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1.125rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid #E2EBE4',
                        backgroundColor: '#FAF7F2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3F2B' }}>
                            {opt.treatmentName}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '20px',
                              backgroundColor: '#E8F5E9',
                              color: '#1E3F2B',
                              border: '1px solid #C8E6C9',
                            }}
                          >
                            {opt.suggestedSessions} Sessions
                          </span>
                        </div>

                        {onOpenPrescribe && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPrescribe(patientId, opt.treatmentName, opt.suggestedSessions);
                            }}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              backgroundColor: '#1E3F2B',
                              color: 'var(--color-white)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Pill size={14} />
                            <span>Prescribe This Protocol</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: '#334155' }}>
                        <strong style={{ color: '#0F172A' }}>Primary Objective: </strong>
                        {opt.primaryObjective}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>
                        <strong style={{ color: '#0F172A' }}>Clinical Rationale: </strong>
                        {opt.rationale}
                      </div>

                      {opt.considerations && (
                        <div style={{ fontSize: '0.75rem', color: '#1E3F2B', backgroundColor: '#E8F5E9', padding: '0.375rem 0.625rem', borderRadius: '4px' }}>
                          <strong>Doctor Consideration: </strong>
                          {opt.considerations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.disclaimer && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', fontStyle: 'italic', borderTop: '1px solid var(--color-slate-200)', paddingTop: '0.625rem', margin: 0 }}>
                  {result.disclaimer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalSupportModal;
