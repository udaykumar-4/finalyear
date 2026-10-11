import React, { useState } from 'react';
import {
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Award,
} from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const PatientFeedbackPage: React.FC = () => {
  const [overallRating, setOverallRating] = useState(5);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [doctorRating, setDoctorRating] = useState(5);
  const [doctorFeedback, setDoctorFeedback] = useState('');
  const [therapistRating, setTherapistRating] = useState(5);
  const [therapistFeedback, setTherapistFeedback] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await feedbackService.submitFeedback({
        overallRating,
        overallFeedback: overallFeedback || undefined,
        doctorRating,
        doctorFeedback: doctorFeedback || undefined,
        therapistRating,
        therapistFeedback: therapistFeedback || undefined,
      });
      setIsSubmitted(true);
      setOverallFeedback('');
      setDoctorFeedback('');
      setTherapistFeedback('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit clinical feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarPicker = (current: number, onChange: (val: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              padding: '0.25rem',
              color: star <= current ? '#D97706' : 'var(--color-slate-300)',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
            }}
          >
            <Star size={24} fill={star <= current ? '#D97706' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Clinical Session Feedback & Rating
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Help our doctors and Panchakarma therapists refine your ongoing care quality
        </p>
      </div>

      {isSubmitted && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Thank You for Your Feedback!</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>
              Your ratings have been securely submitted to clinic quality assurance.
            </div>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Overall Clinic Experience" subtitle="Rate your visit and therapy atmosphere">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                Overall Rating: {overallRating} / 5 Stars
              </label>
              {renderStarPicker(overallRating, setOverallRating)}
            </div>
            <Input
              label="Overall Comments (Optional)"
              placeholder="e.g. Clean Panchakarma rooms, punctual appointments, calming atmosphere"
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
            />
          </div>
        </Card>

        <Card title="Doctor Consultation Rating" subtitle="Rate physician consultation, pulse analysis, and attentiveness">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                Physician Rating: {doctorRating} / 5 Stars
              </label>
              {renderStarPicker(doctorRating, setDoctorRating)}
            </div>
            <Input
              label="Doctor Comments (Optional)"
              placeholder="e.g. Clear explanation of doshas and prescribed remedies"
              value={doctorFeedback}
              onChange={(e) => setDoctorFeedback(e.target.value)}
            />
          </div>
        </Card>

        <Card title="Panchakarma Therapist Rating" subtitle="Rate procedure gentleness, comfort, and care">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                Therapist Rating: {therapistRating} / 5 Stars
              </label>
              {renderStarPicker(therapistRating, setTherapistRating)}
            </div>
            <Input
              label="Therapist Comments (Optional)"
              placeholder="e.g. Excellent pressure during Abhyanga, soothing steam temperature"
              value={therapistFeedback}
              onChange={(e) => setTherapistFeedback(e.target.value)}
            />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send size={16} />}>
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientFeedbackPage;
