import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import { aiService, TreatmentRecommendationResponse } from '../../services/aiService';
import Button from '../common/Button';
import Input from '../common/Input';

export interface ClinicalSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export const ClinicalSupportModal: React.FC<ClinicalSupportModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TreatmentRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await aiService.generateTreatmentRecommendation(patientId, symptoms);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate clinical treatment recommendations.');
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
                color: 'var(--color-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Ayurvedic Clinical Decision Support
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                AI treatment protocol advisory for {patientName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--color-slate-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
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
          <ShieldCheck size={16} />
          <span>Doctor Supervised Only: Requires clinical validation before entering prescription chart.</span>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Presenting Complaints & Doshic Signs"
              placeholder="e.g. Chronic Sandhivata, stiffness in morning, dry skin, aggravated Vata-Kapha"
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
              Generate Protocol Recommendations
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

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Contraindication Warnings */}
              {result.contraindicationWarnings && result.contraindicationWarnings.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--color-error-bg)',
                    border: '1px solid var(--color-error-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-error)', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Clinical Contraindications & Precautions</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--color-error)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {result.contraindicationWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Protocol Options */}
              {result.suggestedOptions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Suggested Ayurvedic Protocols
                  </span>
                  {result.suggestedOptions.map((opt, idx) => (
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
                          {opt.treatmentName}
                        </span>
                        <span className="badge badge-success">
                          {opt.suggestedSessions} Sessions
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)', marginBottom: '0.5rem' }}>
                        <strong>Primary Objective:</strong> {opt.primaryObjective}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', lineHeight: 1.4 }}>
                        <strong>Rationale:</strong> {opt.rationale}
                      </p>
                      {opt.considerations && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', marginTop: '0.25rem' }}>
                          <strong>Considerations:</strong> {opt.considerations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.disclaimer && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', fontStyle: 'italic', borderTop: '1px solid var(--color-slate-100)', paddingTop: '0.5rem' }}>
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
