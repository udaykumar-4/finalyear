import React, { useState } from 'react';
import { X, Sparkles, Activity, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { aiService, DiseasePredictionResponse } from '../../services/aiService';
import Button from '../common/Button';
import Input from '../common/Input';

export interface DiseasePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export const DiseasePredictionModal: React.FC<DiseasePredictionModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<DiseasePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await aiService.generateDiseasePrediction(patientId, symptoms);
      setPrediction(res);
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
        zIndex: 70,
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
          maxWidth: '680px',
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-sage)',
                color: 'var(--color-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Ayurvedic Disease & Imbalance Analyzer
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                Differential diagnostic suggestions for {patientName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--color-slate-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Safety banner */}
        <div
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            borderBottom: '1px solid var(--color-warning-border)',
            padding: '0.625rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}
        >
          <ShieldAlert size={16} />
          <span>CLINICIAN AUDIT NOTICE: Suggestions do not replace clinical physician diagnosis.</span>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Observed Clinical Symptoms & Pulse/Tongue Assessment"
              placeholder="e.g. Acid regurgitation, burning sensation, loose stool, Pitta prakopa signs"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<Sparkles size={16} />}
            >
              Run Diagnostic Imbalance Analysis
            </Button>
          </form>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
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

          {prediction && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {prediction.possibleConditions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Probable Conditions & Imbalances
                  </span>
                  {prediction.possibleConditions.map((cond, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-slate-200)',
                        backgroundColor: 'var(--color-white)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                          {cond.conditionName}
                        </span>
                        <span className="badge badge-warning">
                          Probability: {cond.probabilityCategory}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)', marginBottom: '0.5rem' }}>
                        <strong>Supporting Factors:</strong>
                        <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                          {cond.supportingFactors.map((fac, i) => (
                            <li key={i}>{fac}</li>
                          ))}
                        </ul>
                      </div>
                      {cond.differentialConsiderations && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontStyle: 'italic' }}>
                          <strong>Differentials:</strong> {cond.differentialConsiderations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {prediction.disclaimer && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', borderTop: '1px solid var(--color-slate-100)', paddingTop: '0.5rem' }}>
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
