import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Activity,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';

export interface PatientDashboardPageProps {
  onNavigateTab: (tabId: string) => void;
  onOpenBookingModal: () => void;
  onOpenRecommendationModal: () => void;
  onOpenAIChat: () => void;
}

export const PatientDashboardPage: React.FC<PatientDashboardPageProps> = ({
  onNavigateTab,
  onOpenBookingModal,
  onOpenRecommendationModal,
  onOpenAIChat,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [appts, rx] = await Promise.all([
        appointmentService.getAppointments({ patientId: user._id }),
        prescriptionService.getByPatientId(user._id).catch(() => []),
      ]);
      setAppointments(appts);
      setPrescriptions(rx);
    } catch (err: any) {
      setError(err.message || 'Failed to load wellness dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Next upcoming appointment
  const upcomingAppts = appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const nextAppt = upcomingAppts[0];

  // Primary active prescription
  const activeRx = prescriptions.find((p) => p.status === 'in-progress') || prescriptions[0];
  const rxPct = activeRx
    ? Math.min(100, Math.round(((activeRx.progressCompleted || 0) / activeRx.duration) * 100))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-forest) 0%, #065F46 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 2.5rem',
          color: 'var(--color-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--color-sand)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Holistic Health Portal
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Primary Dosha: {user?.condition || 'Vata-Pitta Balance'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-white)', lineHeight: 1.2 }}>
            Welcome, {user?.full_name || 'Patient'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Your personalized Panchakarma wellness plan, treatment session timeline, and certified physician guidance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={onOpenRecommendationModal}
            leftIcon={<Sparkles size={16} />}
          >
            Explore Therapies
          </Button>
          <Button
            variant="primary"
            onClick={onOpenBookingModal}
            leftIcon={<Calendar size={16} />}
            style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-forest)', border: 'none' }}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Upcoming Sessions"
          value={upcomingAppts.length}
          subtitle="Scheduled appointments"
          icon={<Calendar size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Therapy Adherence"
          value={activeRx ? `${rxPct}%` : 'N/A'}
          subtitle={activeRx ? `${activeRx.progressCompleted || 0} of ${activeRx.duration} sessions` : 'No active course'}
          icon={<Activity size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Completed Consultations"
          value={appointments.filter((a) => a.status === 'completed').length}
          subtitle="Total visits logged"
          icon={<CheckCircle2 size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Clinical Protocols"
          value={prescriptions.length}
          subtitle="Panchakarma courses"
          icon={<FileText size={22} />}
          accentColor="var(--color-amber)"
        />
      </div>

      {/* Two columns: Next Appointment + Active Journey */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Next Scheduled Appointment */}
        <Card
          title="Your Next Scheduled Session"
          subtitle="Clinic arrival time and assigned provider"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('appointments')} rightIcon={<ArrowRight size={14} />}>
              All Bookings
            </Button>
          }
        >
          {nextAppt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-sage)',
                  border: '1px solid var(--color-sage-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-forest)' }}>
                    {nextAppt.treatment}
                  </span>
                  <span className="badge badge-success">{nextAppt.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate-700)', fontSize: '0.875rem' }}>
                  <Clock size={16} />
                  <span>
                    {new Date(nextAppt.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at <strong>{nextAppt.appointment_time}</strong>
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
                Please arrive 10 minutes prior to your therapy session in loose, comfortable clothing.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)' }}>
              <p>You have no upcoming sessions scheduled.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBookingModal}
                style={{ marginTop: '0.75rem' }}
              >
                Schedule an Appointment
              </Button>
            </div>
          )}
        </Card>

        {/* Active Panchakarma Journey */}
        <Card
          title="Active Panchakarma Journey"
          subtitle="Current therapy course and completion stages"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('treatments')} rightIcon={<ArrowRight size={14} />}>
              View Journey
            </Button>
          }
        >
          {activeRx ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                    {activeRx.treatment}
                  </span>
                  <span className="badge badge-success">
                    {activeRx.progressCompleted || 0} / {activeRx.duration} Sessions
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${rxPct}%`, height: '100%', backgroundColor: 'var(--color-forest)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-slate-500)' }}>
                  <span>Purvakarma</span>
                  <span>Pradhanakarma</span>
                  <span>Paschatkarma ({rxPct}%)</span>
                </div>
              </div>

              {activeRx.notes && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                  <strong>Doctor Instructions:</strong> {activeRx.notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)' }}>
              No active Panchakarma treatment course in progress.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
