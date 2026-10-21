import React, { useState, useEffect } from 'react';
import { X, Sparkles, Activity, AlertCircle, ShieldAlert, CheckCircle2, Stethoscope, ArrowRight } from 'lucide-react';
import { aiService, DiseasePredictionResponse } from '../../services/aiService';
import Button from '../common/Button';
import Input from '../common/Input';

export interface DiseasePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

const COMMON_DISEASE_PRESETS = [
  { label: '🦴 Joint Pain & Stiffness', query: 'Sandhigata Vata: Knee and finger joint crepitus, pain aggravated in cold weather, morning stiffness' },
  { label: '🔥 Digestive Fire & Acidity', query: 'Amlapitta: Heartburn, sour belching, epigastric burning, nausea, post-meal acidity' },
  { label: '🧠 Migraine & Headache', query: 'Shiroroga: Unilateral throbbing headache, temporal pressure, visual strain, aggravated by stress' },
  { label: '🌿 Lower Back Pain & Sciatica', query: 'Gridhrasi: Sharp shooting pain from lumbar spine down posterior leg, aggravated by coughing' },
  { label: '💆 Insomnia & Chronic Anxiety', query: 'Anidra: Restless mind, fragmented sleep, heart palpitation, dry skin, severe Vata disturbance' },
];

export const DiseasePredictionModal: React.FC<DiseasePredictionModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientCondition,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<DiseasePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (patientCondition && !symptoms) {
        setSymptoms(patientCondition);
      }
      setError(null);
    }
  }, [isOpen, patientCondition]);

  if (!isOpen) return null;

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    const queryText = (symptoms || patientCondition || 'General Clinical Symptoms').trim();

    try {
      const res = await aiService.generateDiseasePrediction(patientId, queryText);
      if (!res.success && res.message && (!res.possibleConditions || res.possibleConditions.length === 0)) {
        setError(res.message);
        setPrediction(null);
      } else {
        setPrediction(res);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze doshic imbalances and predictions.');
    } finally {
      setIsLoading(false);
    }
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
              <Activity size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E3F2B', margin: 0 }}>
                Ayurvedic Disease & Imbalance Analyzer
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#4A6B56', margin: '0.125rem 0 0 0' }}>
                Differential diagnostic suggestions for <strong>{patientName}</strong>
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

        {/* Safety banner */}
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
          <ShieldAlert size={16} color="#D97706" />
          <span>Clinical Decision Advisory: Generates differential guidance only. Physical Pariksha & clinical tests required.</span>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Presets */}
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4A6B56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Common Doshic Conditions (or type below):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              {COMMON_DISEASE_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSymptoms(preset.query)}
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

          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Input
              label="Presenting Clinical Symptoms & Observations"
              placeholder="e.g. Swollen joints, morning stiffness, heaviness after eating, dry tongue coat"
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
              {isLoading ? 'Analyzing Clinical Imbalances...' : 'Analyze Doshic Imbalances'}
            </Button>
          </form>

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
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {prediction && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Limitations Notice */}
              {prediction.limitations && (
                <div
                  style={{
                    backgroundColor: 'var(--color-warning-bg)',
                    border: '1px solid var(--color-warning-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-warning)',
                  }}
                >
                  <strong>Clinical Limitations:</strong> {prediction.limitations}
                </div>
              )}

              {/* Conditions List */}
              {prediction.possibleConditions && prediction.possibleConditions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E3F2B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Differential Clinical Possibilities ({prediction.possibleConditions.length})
                  </span>

                  {prediction.possibleConditions.map((cond, i) => (
                    <div
                      key={i}
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3F2B' }}>
                          {cond.conditionName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '20px',
                            backgroundColor: cond.probabilityCategory?.toLowerCase().includes('high') ? '#FEE2E2' : '#FEF3C7',
                            color: cond.probabilityCategory?.toLowerCase().includes('high') ? '#991B1B' : '#92400E',
                            border: '1px solid currentColor',
                          }}
                        >
                          {cond.probabilityCategory}
                        </span>
                      </div>

                      {cond.supportingFactors && cond.supportingFactors.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          <strong style={{ color: '#0F172A' }}>Supporting Doshic Indicators: </strong>
                          {cond.supportingFactors.join(' • ')}
                        </div>
                      )}

                      {cond.differentialConsiderations && (
                        <div style={{ fontSize: '0.75rem', color: '#1E3F2B', backgroundColor: '#E8F5E9', padding: '0.375rem 0.625rem', borderRadius: '4px' }}>
                          <strong>Differential Consideration: </strong>
                          {cond.differentialConsiderations}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {prediction.disclaimer && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', fontStyle: 'italic', borderTop: '1px solid var(--color-slate-200)', paddingTop: '0.625rem', margin: 0 }}>
                  {prediction.disclaimer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseasePredictionModal;
