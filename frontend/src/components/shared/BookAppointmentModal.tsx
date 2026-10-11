import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle, CheckCircle, Sparkles, Stethoscope, Activity } from 'lucide-react';
import { appointmentService, SlotAvailability } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { User as UserType } from '../../types/user';
import Button from '../common/Button';
import Input from '../common/Input';

export interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPatientId?: string;
  defaultDoctorId?: string;
  defaultTherapistId?: string;
  currentUserId?: string;
  userRole?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId,
  defaultDoctorId,
  defaultTherapistId,
  currentUserId,
  userRole,
}) => {
  const [providerType, setProviderType] = useState<'doctor' | 'therapist'>(defaultTherapistId ? 'therapist' : 'doctor');
  const [providers, setProviders] = useState<UserType[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(defaultDoctorId || defaultTherapistId || '');
  const [patients, setPatients] = useState<UserType[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId || (userRole === 'patient' && currentUserId ? currentUserId : ''));
  const [treatment, setTreatment] = useState('Consultation');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load Patients if Admin, Doctor, or Receptionist
  useEffect(() => {
    if (isOpen && userRole !== 'patient') {
      userService.getAllUsers('patient')
        .then((res) => {
          setPatients(res);
          if (!selectedPatientId && res.length > 0) {
            setSelectedPatientId(res[0]._id);
          }
        })
        .catch((err) => console.warn('Failed to load patient roster:', err));
    }
  }, [isOpen, userRole]);

  // Load Providers when providerType changes
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingProviders(true);
    userService.getAllUsers(providerType)
      .then((res) => {
        setProviders(res);
        if (res.length > 0) {
          const match = res.find((p) => p._id === (providerType === 'doctor' ? defaultDoctorId : defaultTherapistId));
          setSelectedProviderId(match ? match._id : res[0]._id);
        } else {
          setSelectedProviderId('');
        }
      })
      .catch((err) => console.warn('Failed to load providers:', err))
      .finally(() => setIsLoadingProviders(false));
  }, [isOpen, providerType, defaultDoctorId, defaultTherapistId]);

  // Load availability slots when provider and date are chosen
  useEffect(() => {
    if (!isOpen || !selectedProviderId || !selectedDate) return;
    setIsLoadingSlots(true);
    setError(null);
    setSelectedTime('');

    appointmentService.getAvailability(selectedProviderId, providerType, selectedDate)
      .then((res) => {
        setSlots(res.slots || []);
      })
      .catch((err) => {
        // Fallback default clinical slots if offline or availability endpoint error
        setSlots([
          { time: '09:00 AM', start: '09:00', status: 'available' },
          { time: '10:00 AM', start: '10:00', status: 'available' },
          { time: '11:00 AM', start: '11:00', status: 'available' },
          { time: '02:00 PM', start: '14:00', status: 'available' },
          { time: '03:00 PM', start: '15:00', status: 'available' },
          { time: '04:00 PM', start: '16:00', status: 'available' },
        ]);
      })
      .finally(() => setIsLoadingSlots(false));
  }, [isOpen, selectedProviderId, providerType, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select or specify a patient.');
      return;
    }
    if (!selectedProviderId) {
      setError('Please select a healthcare provider.');
      return;
    }
    if (!selectedTime) {
      setError('Please select an available appointment slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await appointmentService.createAppointment({
        patientId: selectedPatientId,
        doctorId: providerType === 'doctor' ? selectedProviderId : undefined,
        therapistId: providerType === 'therapist' ? selectedProviderId : undefined,
        treatment: treatment || (providerType === 'doctor' ? 'Consultation' : 'Panchakarma Therapy'),
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment. Slot might be conflict-locked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 60,
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
          maxWidth: '560px',
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
              <Calendar size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                Schedule Clinical Appointment
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                Verified slot booking with instant calendar lock
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          {success && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-success)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={16} />
              <span>Appointment successfully booked and synced!</span>
            </div>
          )}

          {/* Patient Selection for Staff */}
          {userRole !== 'patient' && (
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                Select Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-slate-200)',
                  backgroundColor: 'var(--color-white)',
                  fontSize: '0.875rem',
                  color: 'var(--color-slate-900)',
                  outline: 'none',
                }}
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.full_name} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Type Toggle */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
              Provider Discipline
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setProviderType('doctor');
                  setTreatment('Consultation');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${providerType === 'doctor' ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                  backgroundColor: providerType === 'doctor' ? 'var(--color-sage)' : 'var(--color-white)',
                  color: providerType === 'doctor' ? 'var(--color-forest)' : 'var(--color-slate-600)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                <Stethoscope size={16} />
                <span>Doctor Consultation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProviderType('therapist');
                  setTreatment('Panchakarma Therapy');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${providerType === 'therapist' ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                  backgroundColor: providerType === 'therapist' ? 'var(--color-sage)' : 'var(--color-white)',
                  color: providerType === 'therapist' ? 'var(--color-forest)' : 'var(--color-slate-600)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                <Activity size={16} />
                <span>Therapist Session</span>
              </button>
            </div>
          </div>

          {/* Assigned Provider Select */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
              Select {providerType === 'doctor' ? 'Doctor' : 'Therapist'}
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              disabled={isLoadingProviders}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-slate-200)',
                backgroundColor: 'var(--color-white)',
                fontSize: '0.875rem',
                color: 'var(--color-slate-900)',
                outline: 'none',
              }}
            >
              {providers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.full_name} {p.designation ? `(${p.designation})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Name */}
          <Input
            label="Therapy or Purpose"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="e.g. Abhyanga, Shirodhara, Nasya or Initial Assessment"
            required
          />

          {/* Date Picker */}
          <Input
            label="Appointment Date"
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />

          {/* Available Slots Grid */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.5rem' }}>
              Available Time Slots {isLoadingSlots ? '(Checking...)' : ''}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.5rem' }}>
              {slots.map((s, idx) => {
                const isSelected = selectedTime === s.time;
                const isAvailable = s.status === 'available';
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedTime(s.time)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      border: `1.5px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                      backgroundColor: isSelected
                        ? 'var(--color-emerald)'
                        : isAvailable
                        ? 'var(--color-white)'
                        : 'var(--color-slate-100)',
                      color: isSelected
                        ? 'var(--color-white)'
                        : isAvailable
                        ? 'var(--color-slate-800)'
                        : 'var(--color-slate-400)',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!selectedTime || !selectedProviderId}
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
