import React, { useState } from 'react';
import { X, Sparkles, BookOpen, AlertCircle, ShieldCheck } from 'lucide-react';
import { patientTreatmentRecommendationService } from '../../services/patientTreatmentRecommendationService';
import { PatientTreatmentRecommendationResponse } from '../../types/patientTreatmentRecommendation';
import Button from '../common/Button';
import Input from '../common/Input';

export interface PatientTreatmentRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_SYMPTOM_CHIPS = [
  'Joint Pain & Stiffness',
  'Digestive Issues / Bloating',
  'Chronic Stress & Insomnia',
  'Fatigue & Low Energy',
  'Skin Dryness & Rashes',
  'Respiratory Congestion',
];

export const PatientTreatmentRecommendationModal: React.FC<PatientTreatmentRecommendationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PatientTreatmentRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms && selectedChips.length === 0) {
      setError('Please enter symptoms or select at least one tag.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await patientTreatmentRecommendationService.generateRecommendation(
        symptoms,
        selectedChips
      );
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve educational recommendations.');
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
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Ayurvedic Therapy Explorer
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                Educational Panchakarma recommendations & classical references
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--color-slate-400)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                Quick Symptom Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {COMMON_SYMPTOM_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      style={{
                        padding: '0.3125rem 0.625rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: `1px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                        backgroundColor: isSelected ? 'var(--color-sage)' : 'var(--color-white)',
                        color: isSelected ? 'var(--color-forest)' : 'var(--color-slate-700)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Additional Health Observations"
              placeholder="e.g. Feeling sluggish after heavy meals, neck stiffness after long desk work"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Sparkles size={16} />}>
              Explore Recommended Therapies
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
              {result.recommendations && result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-white)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-forest)' }}>
                      {rec.therapyName}
                    </span>
                    <span className="badge badge-success">
                      {rec.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', marginBottom: '0.375rem' }}>
                    <strong>Goal:</strong> {rec.objective}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', lineHeight: 1.4 }}>
                    <strong>Traditional Rationale:</strong> {rec.traditionalRationale}
                  </p>
                  {rec.classicalReferences && rec.classicalReferences.length > 0 && (
                    <div style={{ marginTop: '0.75rem', padding: '0.625rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-slate-200)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-700)' }}>
                        <BookOpen size={14} />
                        <span>Classical Ayurvedic Source:</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)', display: 'block', marginTop: '0.125rem' }}>
                        {rec.classicalReferences[0].source} - {rec.classicalReferences[0].title}
                      </span>
                    </div>
                  )}
                </div>
              ))}

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

export default PatientTreatmentRecommendationModal;
