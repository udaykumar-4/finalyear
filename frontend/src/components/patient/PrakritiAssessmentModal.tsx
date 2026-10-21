import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  PrakritiQuestion,
  PrakritiAnswer,
  PrakritiAssessmentRecord,
  DoshaType,
} from '../../types/prakriti';
import {
  DEFAULT_QUESTIONS,
  PRAKRITI_THEME,
  CLINICAL_DISCLAIMER,
} from '../../constants/prakritiData';
import { prakritiService } from '../../services/prakritiService';
import Button from '../common/Button';

export interface PrakritiAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'intro' | 'quiz' | 'result' | 'history';
  onAssessmentCompleted?: (record: PrakritiAssessmentRecord) => void;
}

type ModalMode = 'intro' | 'quiz' | 'review' | 'result' | 'history';

export const PrakritiAssessmentModal: React.FC<PrakritiAssessmentModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'intro',
  onAssessmentCompleted,
}) => {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [questions, setQuestions] = useState<PrakritiQuestion[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, { dosha: DoshaType; text: string }>>({});
  const [activeAssessment, setActiveAssessment] = useState<PrakritiAssessmentRecord | null>(null);
  const [history, setHistory] = useState<PrakritiAssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load questions and existing assessments when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [qRes, latest, hist] = await Promise.all([
          prakritiService.getQuestions().catch(() => null),
          prakritiService.getLatestAssessment().catch(() => null),
          prakritiService.getHistory().catch(() => []),
        ]);

        if (isMounted) {
          if (qRes && qRes.questions && qRes.questions.length > 0) {
            setQuestions(qRes.questions);
          }
          if (latest) {
            setActiveAssessment(latest);
            if (initialMode === 'result') {
              setMode('result');
            } else if (initialMode === 'quiz') {
              setMode('quiz');
            } else if (initialMode === 'history') {
              setMode('history');
            } else {
              setMode('result');
            }
          } else {
            setMode(initialMode === 'history' ? 'history' : 'intro');
          }
          setHistory(hist || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load Prakriti assessment data.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const handleSelectOption = (dosha: DoshaType, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { dosha, text },
    }));
  };

  const handleNext = () => {
    if (!selectedAnswers[currentQuestion.id]) {
      setError('Please select an option that matches your lifelong constitution.');
      return;
    }
    setError(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMode('review');
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setMode('intro');
    }
  };

  const startQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setError(null);
    setMode('quiz');
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please complete all 8 questions. Missing: ${unanswered.map((u) => u.title).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: PrakritiAnswer[] = questions.map((q) => {
        const ans = selectedAnswers[q.id];
        return {
          questionId: q.id,
          category: q.category,
          title: q.title,
          selectedDosha: ans.dosha,
          answerText: ans.text,
        };
      });

      const record = await prakritiService.submitAssessment(payload);
      setActiveAssessment(record);
      prakritiService.getHistory().then((h) => setHistory(h)).catch(() => {});
      if (onAssessmentCompleted) {
        onAssessmentCompleted(record);
      }
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FAF7F2',
          border: '1.5px solid #D1E0D1',
          borderRadius: 'var(--radius-xl, 16px)',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🌿</span>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E3F2B', margin: 0 }}>
                Prakriti Assessment
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Classical Ayurvedic Constitutional Analysis
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--color-error-bg, #FEF2F2)',
                border: '1px solid var(--color-error-border, #FECACA)',
                borderRadius: '8px',
                color: 'var(--color-error, #DC2626)',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: INTRO VIEW */}
          {/* ========================================================================= */}
          {mode === 'intro' && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem 0 1.5rem 0',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#EBF2EB',
                    color: '#2D5A3C',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                  }}
                >
                  Ayurvedic Constitutional Science
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3F2B', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                  Discover Your Inherent Prakriti
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
                  In Classical Ayurveda, your <strong>Prakriti</strong> is your unique constitutional blueprint determined at birth across the three bio-energies: <strong>Vata</strong> (Kinetic), <strong>Pitta</strong> (Transformative), and <strong>Kapha</strong> (Structural).
                </p>
              </div>

              {/* Distinguishing Prakriti vs Vikriti */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1E0D1',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <BookOpen size={16} color="#2D5A3C" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3F2B' }}>
                    Critical Distinction: Prakriti vs Vikriti
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <strong>• Prakriti (Baseline Constitution):</strong> Your lifelong innate characteristics (e.g. bone frame, baseline skin moisture, natural metabolism since youth).
                  </div>
                  <div>
                    <strong>• Vikriti (Current Imbalance):</strong> Temporary symptoms, acute illnesses, or stress reactions caused by climate, lifestyle, or diet changes.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    *Please answer this questionnaire based on your lifelong natural traits rather than current short-term illness.
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⏱️</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1F2937' }}>8 Core Questions</div>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Takes ~3 minutes</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📊</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1F2937' }}>Tri-Dosha Ratio</div>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Transparent breakdown</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🥗</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1F2937' }}>Diet & Regimen</div>
                  <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>Pathya & Dinacharya</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startQuiz}
                  rightIcon={<ArrowRight size={18} />}
                  style={{ backgroundColor: '#2D5A3C', borderColor: '#2D5A3C' }}
                >
                  {activeAssessment ? 'Start Retake Assessment' : 'Begin Assessment'}
                </Button>

                {activeAssessment && (
                  <Button variant="outline" size="md" onClick={() => setMode('result')}>
                    View Previous Result
                  </Button>
                )}

                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setMode('history')}>
                    View Assessment History ({history.length} records)
                  </Button>
                )}
              </div>

              {/* Disclaimer */}
              <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '8px', fontSize: '0.6875rem', color: '#92400E', lineHeight: 1.5, textAlign: 'center' }}>
                {CLINICAL_DISCLAIMER}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STEP-BY-STEP QUIZ */}
          {/* ========================================================================= */}
          {mode === 'quiz' && currentQuestion && (
            <div>
              {/* Progress bar */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', marginBottom: '0.35rem' }}>
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span style={{ color: '#2D5A3C' }}>{progressPercent}% Completed</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#2D5A3C', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Question Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1E0D1',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#5C7C5D', letterSpacing: '0.05em' }}>
                  {currentQuestion.category}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E3F2B', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                  {currentQuestion.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
                  {currentQuestion.description}
                </p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQuestion.id]?.dosha === opt.dosha;
                  const doshaMeta = PRAKRITI_THEME[opt.dosha];

                  return (
                    <div
                      key={opt.dosha}
                      onClick={() => handleSelectOption(opt.dosha, opt.label)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${doshaMeta.primary}` : '1.5px solid #E5E7EB',
                        backgroundColor: isSelected ? doshaMeta.light : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? doshaMeta.primary : '#9CA3AF'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: doshaMeta.primary }} />
                          )}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isSelected ? doshaMeta.primary : '#374151' }}>
                          {doshaMeta.name}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0, paddingLeft: '1.5rem', lineHeight: 1.5 }}>
                        {opt.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <Button variant="outline" size="md" onClick={handlePrev} leftIcon={<ArrowLeft size={16} />}>
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  rightIcon={<ArrowRight size={16} />}
                  style={{ backgroundColor: '#2D5A3C', borderColor: '#2D5A3C' }}
                >
                  {currentIndex === questions.length - 1 ? 'Review Selections' : 'Next Question'}
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: REVIEW BEFORE SUBMIT */}
          {/* ========================================================================= */}
          {mode === 'review' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3F2B', marginBottom: '0.25rem' }}>
                  Review Your Selections
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0 }}>
                  Review all 8 answers below before computing your Prakriti constitutional profile. You can click any question to modify it.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {questions.map((q, idx) => {
                  const selected = selectedAnswers[q.id];
                  const doshaMeta = selected ? PRAKRITI_THEME[selected.dosha] : null;

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setMode('quiz');
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B' }}>
                          Q{idx + 1}. {q.title}
                        </span>
                        {doshaMeta && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              backgroundColor: doshaMeta.light,
                              color: doshaMeta.primary,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            {selected.dosha.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.4 }}>
                        {selected ? selected.text : 'Unanswered'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="outline" size="md" onClick={() => setMode('quiz')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  style={{ flex: 1, backgroundColor: '#2D5A3C', borderColor: '#2D5A3C' }}
                >
                  Submit & Compute Prakriti
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: RESULTS DISPLAY */}
          {/* ========================================================================= */}
          {mode === 'result' && activeAssessment && (
            <div>
              {/* Banner */}
              <div
                style={{
                  backgroundColor: '#EBF2EB',
                  border: '1.5px solid #C8DBC9',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#2D5A3C',
                    color: '#FFFFFF',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                  }}
                >
                  {activeAssessment.constitutionType} Constitution
                </span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E3F2B', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                  🌿 {activeAssessment.dominantConstitution}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#5C7C5D', fontWeight: 600 }}>
                  Assessed on{' '}
                  {new Date(activeAssessment.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Comparison Meters */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1E3F2B', marginBottom: '0.25rem' }}>
                  Tri-Dosha Ratio Comparison
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '1rem' }}>
                  Calculated from your 8 constitutional responses:
                </p>

                {/* Vata Bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ color: PRAKRITI_THEME.vata.primary }}>Vata (Air & Space)</span>
                    <span>{activeAssessment.scores.vata}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeAssessment.scores.vata}%`, height: '100%', backgroundColor: PRAKRITI_THEME.vata.primary }} />
                  </div>
                </div>

                {/* Pitta Bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ color: PRAKRITI_THEME.pitta.primary }}>Pitta (Fire & Water)</span>
                    <span>{activeAssessment.scores.pitta}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeAssessment.scores.pitta}%`, height: '100%', backgroundColor: PRAKRITI_THEME.pitta.primary }} />
                  </div>
                </div>

                {/* Kapha Bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ color: PRAKRITI_THEME.kapha.primary }}>Kapha (Earth & Water)</span>
                    <span>{activeAssessment.scores.kapha}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeAssessment.scores.kapha}%`, height: '100%', backgroundColor: PRAKRITI_THEME.kapha.primary }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.6875rem', color: '#6B7280', backgroundColor: '#F9FAFB', padding: '0.5rem 0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                  ℹ️ <strong>Methodology Note:</strong> Evaluated using classical Samhita constitutional typology (v{activeAssessment.scoringMethodologyVersion || '1.0'}). Single-dosha dominance requires ≥45% with a distinct lead over second dosha; otherwise dual (Dvandvaja) combination applies.
                </div>
              </div>

              {/* Profile Details */}
              {activeAssessment.profile && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1E3F2B', marginBottom: '0.5rem' }}>
                    Constitutional Insights & Qualities (Gunas)
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {activeAssessment.profile.summary}
                  </p>

                  {/* Dietary Guidance */}
                  {activeAssessment.profile.diet && (
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B', marginBottom: '0.35rem' }}>
                        🥗 Dietary Recommendations (Pathya)
                      </div>
                      {activeAssessment.profile.diet.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '0.2rem' }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lifestyle Guidance */}
                  {activeAssessment.profile.lifestyle && (
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B', marginBottom: '0.35rem' }}>
                        🧘 Daily Lifestyle (Dinacharya)
                      </div>
                      {activeAssessment.profile.lifestyle.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '0.2rem' }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Seasonal Care */}
                  {activeAssessment.profile.seasonal && (
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E3F2B', marginBottom: '0.35rem' }}>
                        🍂 Seasonal Care (Ritucharya)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.5 }}>
                        • {activeAssessment.profile.seasonal}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={startQuiz}
                  leftIcon={<RotateCcw size={16} />}
                  style={{ backgroundColor: '#2D5A3C', borderColor: '#2D5A3C' }}
                >
                  Retake Assessment
                </Button>
                {history.length > 1 && (
                  <Button variant="outline" size="md" onClick={() => setMode('history')}>
                    View Assessment History ({history.length})
                  </Button>
                )}
                <Button variant="ghost" size="md" onClick={onClose}>
                  Done
                </Button>
              </div>

              {/* Disclaimer */}
              <div style={{ marginTop: '1.25rem', padding: '0.65rem 0.85rem', backgroundColor: '#FEF3C7', borderRadius: '8px', fontSize: '0.6875rem', color: '#92400E', lineHeight: 1.5, textAlign: 'center' }}>
                {activeAssessment.disclaimer || CLINICAL_DISCLAIMER}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: HISTORY LIST */}
          {/* ========================================================================= */}
          {mode === 'history' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3F2B', marginBottom: '0.25rem' }}>
                  Assessment History
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: 0 }}>
                  Chronological records of all completed constitutional assessments:
                </p>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No historical records found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {history.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setActiveAssessment(item);
                        setMode('result');
                      }}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1E3F2B' }}>
                          🌿 {item.dominantConstitution}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#EBF2EB', color: '#5C7C5D', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {item.constitutionType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        📅 {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        <span style={{ color: PRAKRITI_THEME.vata.primary }}>Vata: {item.scores.vata}%</span>
                        <span style={{ color: PRAKRITI_THEME.pitta.primary }}>Pitta: {item.scores.pitta}%</span>
                        <span style={{ color: PRAKRITI_THEME.kapha.primary }}>Kapha: {item.scores.kapha}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="primary" size="md" onClick={startQuiz} style={{ backgroundColor: '#2D5A3C', borderColor: '#2D5A3C' }}>
                  Take New Assessment
                </Button>
                <Button variant="outline" size="md" onClick={() => setMode(activeAssessment ? 'result' : 'intro')}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrakritiAssessmentModal;
