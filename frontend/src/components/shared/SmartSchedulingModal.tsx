import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { smartSchedulingService, RecommendedSlot } from '../../services/smartSchedulingService';
import Button from '../common/Button';
import Input from '../common/Input';

export interface SmartSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName?: string;
  onSelectSlot: (date: string, time: string) => void;
}

export const SmartSchedulingModal: React.FC<SmartSchedulingModalProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName,
  onSelectSlot,
}) => {
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [isLoading, setIsLoading] = useState(false);
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [recommendedSlots, setRecommendedSlots] = useState<RecommendedSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckAndRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setConflictReason(null);
    setRecommendedSlots([]);

    try {
      // Step 1: Check Conflicts
      const conflictRes = await smartSchedulingService.checkConflicts(staffId, preferredDate, preferredTime);
      if (conflictRes.hasConflict) {
        setConflictReason(conflictRes.reason || 'Requested slot has a clinician or room overlap.');
      }

      // Step 2: Fetch AI Ranked Recommendations
      const recRes = await smartSchedulingService.getRecommendations(staffId, preferredDate, preferredTime);
      setRecommendedSlots(recRes.recommendedSlots || []);
    } catch (err: any) {
      setError(err.message || 'Unable to check AI slot availability.');
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
        zIndex: 65,
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
          maxWidth: '520px',
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
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-sage)',
                color: 'var(--color-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Smart Scheduling Assistant
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                AI conflict resolution and slot ranking for {staffName || 'Clinician'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--color-slate-400)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleCheckAndRecommend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Target Date"
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
              <Input
                label="Preferred Time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="10:00 AM"
                required
              />
            </div>

            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Sparkles size={16} />}>
              Analyze Conflicts & Find Slots
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {conflictReason && (
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-warning)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Clock size={15} />
                <span>Conflict Detected</span>
              </div>
              <p>{conflictReason}</p>
            </div>
          )}

          {recommendedSlots.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.625rem' }}>
                Ranked AI Alternative Recommendations
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recommendedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-slate-200)',
                      backgroundColor: 'var(--color-white)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                          {slot.time}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                          Score: {slot.score}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.125rem', display: 'block' }}>
                        {slot.rationale}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onSelectSlot(preferredDate, slot.time);
                        onClose();
                      }}
                    >
                      Select Slot
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSchedulingModal;
