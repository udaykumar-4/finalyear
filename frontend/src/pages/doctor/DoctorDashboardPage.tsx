import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Pill,
  Sparkles,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Stethoscope,
  Activity,
  AlertCircle,
  FilePlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { feedbackService } from '../../services/feedbackService';
import { Appointment } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import { Feedback } from '../../types/feedback';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export interface DoctorDashboardPageProps {
  onNavigateTab: (tabId: string) => void;
  onOpenClinicalSupport: (patientId: string, patientName: string) => void;
  onOpenBookingModal: () => void;
}

export const DoctorDashboardPage: React.FC<DoctorDashboardPageProps> = ({
  onNavigateTab,
  onOpenClinicalSupport,
  onOpenBookingModal,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoctorData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [appts, rx, fb] = await Promise.all([
        appointmentService.getAppointments({ doctorId: user._id }),
        prescriptionService.getByDoctorId(user._id).catch(() => []),
        feedbackService.getDoctorFeedback().catch(() => []),
      ]);
      setAppointments(appts);
      setPrescriptions(rx);
      setFeedback(fb);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === todayStr && a.status !== 'cancelled';
  });

  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress');
  const completedTreatments = prescriptions.filter((p) => p.status === 'completed');

  const validRatings = feedback.map((f) => f.doctorRating || f.overallRating).filter(Boolean);
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((a, b) => (a || 0) + (b || 0), 0) / validRatings.length).toFixed(1)
    : '4.9';

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
              Physician Consultation Suite
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              {user?.designation || 'Senior Ayurvedic Physician'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-white)', lineHeight: 1.2 }}>
            Welcome, Dr. {user?.full_name || 'Physician'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Manage diagnostic pulse assessments, issue tailored Panchakarma treatment protocols, and utilize clinical AI support.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={() => onNavigateTab('prescriptions')}
            leftIcon={<Pill size={16} />}
          >
            Prescriptions
          </Button>
          <Button
            variant="primary"
            onClick={onOpenBookingModal}
            leftIcon={<Calendar size={16} />}
            style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-forest)', border: 'none' }}
          >
            Book Slot
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

      {/* Doctor KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Today's Consultations"
          value={todayAppts.length}
          subtitle={`${appointments.length} total scheduled`}
          icon={<Calendar size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Active Regimens"
          value={activeTreatments.length}
          subtitle={`${completedTreatments.length} regimens concluded`}
          icon={<Pill size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Patient Experience Rating"
          value={`${avgRating} / 5`}
          subtitle={`${feedback.length} verified ratings`}
          icon={<Star size={22} />}
          accentColor="var(--color-amber)"
        />
        <StatCard
          title="Clinical Protocols"
          value={prescriptions.length}
          subtitle="Panchakarma courses issued"
          icon={<Stethoscope size={22} />}
          accentColor="var(--color-forest)"
        />
      </div>

      {/* Main split: Today's queue + active treatments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Consultations Queue */}
        <Card
          title="Today's Consultation Queue"
          subtitle="Real-time patient intake and status"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('appointments')} rightIcon={<ArrowRight size={14} />}>
              All Appointments
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayAppts.map((app) => {
              const patientName = typeof app.patientId === 'object' ? app.patientId.full_name : 'Patient Record';
              const patientId = typeof app.patientId === 'object' ? app.patientId._id : app.patientId;
              return (
                <div
                  key={app._id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-slate-900)', fontSize: '0.9375rem' }}>
                      {patientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.125rem' }}>
                      {app.treatment} at <strong>{app.appointment_time}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-info">{app.status}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenClinicalSupport(patientId, patientName)}
                      leftIcon={<Sparkles size={14} />}
                    >
                      AI Triage
                    </Button>
                  </div>
                </div>
              );
            })}
            {todayAppts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                No consultations scheduled for today.
              </div>
            )}
          </div>
        </Card>

        {/* Active Panchakarma Regimens */}
        <Card
          title="Active Panchakarma Regimens"
          subtitle="Treatment adherence and therapy stage tracking"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('prescriptions')} rightIcon={<ArrowRight size={14} />}>
              Manage Rx
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeTreatments.slice(0, 4).map((rx) => {
              const patientName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient';
              const pct = Math.min(100, Math.round(((rx.progressCompleted || 0) / rx.duration) * 100));
              return (
                <div
                  key={rx._id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-white)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-slate-900)', fontSize: '0.875rem' }}>
                      {patientName} - {rx.treatment}
                    </span>
                    <span className="badge badge-success">{pct}%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginBottom: '0.5rem' }}>
                    Session {rx.progressCompleted || 0} of {rx.duration}
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-emerald)' }} />
                  </div>
                </div>
              );
            })}
            {activeTreatments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                No active therapy courses currently running.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
