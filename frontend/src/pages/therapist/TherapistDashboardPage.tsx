import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { Prescription } from '../../types/prescription';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export interface TherapistDashboardPageProps {
  onNavigateTab: (tabId: string) => void;
}

export const TherapistDashboardPage: React.FC<TherapistDashboardPageProps> = ({
  onNavigateTab,
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
        appointmentService.getAppointments({ therapistId: user._id }),
        prescriptionService.getByTherapistId(user._id).catch(() => []),
      ]);
      setAppointments(appts);
      setPrescriptions(rx);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapist dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update session status.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === todayStr && a.status !== 'cancelled';
  });

  const completedToday = todaySessions.filter((s) => s.status === 'completed').length;
  const pendingToday = todaySessions.length - completedToday;
  const activeTreatments = prescriptions.filter((p) => p.status === 'in-progress');
  const uniquePatients = new Set(
    prescriptions.map((p) => (typeof p.patientId === 'object' ? p.patientId._id : p.patientId))
  ).size;

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
              Panchakarma Clinical Suite
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              {user?.designation || 'Certified Panchakarma Therapist'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-white)', lineHeight: 1.2 }}>
            Welcome, {user?.full_name || 'Therapist'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Deliver classical Shodhana therapies, manage daily session timelines, and log treatment stage progression.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={() => onNavigateTab('schedule')}
            leftIcon={<Clock size={16} />}
          >
            Today's Schedule
          </Button>
          <Button
            variant="primary"
            onClick={() => onNavigateTab('treatments')}
            leftIcon={<Activity size={16} />}
            style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-forest)', border: 'none' }}
          >
            Panchakarma Protocols
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

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Today's Sessions"
          value={todaySessions.length}
          subtitle={`${completedToday} finished today`}
          icon={<Clock size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Pending Today"
          value={pendingToday}
          subtitle="Remaining therapy slots"
          icon={<Calendar size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Active Protocols"
          value={activeTreatments.length}
          subtitle="Assigned Panchakarma courses"
          icon={<Activity size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Assigned Patients"
          value={uniquePatients}
          subtitle="Individual patient caseload"
          icon={<Users size={22} />}
          accentColor="var(--color-amber)"
        />
      </div>

      {/* Two columns: Daily Queue + Active Regimens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Queue */}
        <Card
          title="Today's Therapy Queue"
          subtitle="Session schedule & room progression"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('schedule')} rightIcon={<ArrowRight size={14} />}>
              Full Timeline
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todaySessions.map((s) => {
              const patientName = typeof s.patientId === 'object' ? s.patientId.full_name : 'Patient Record';
              return (
                <div
                  key={s._id}
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
                      {s.treatment} at <strong>{s.appointment_time}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={`badge ${
                        s.status === 'completed'
                          ? 'badge-success'
                          : s.status === 'in-progress'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleUpdateStatus(s._id, s.status === 'scheduled' ? 'in-progress' : 'completed')
                        }
                      >
                        {s.status === 'scheduled' ? 'Start Session' : 'Mark Done'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {todaySessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                No therapy sessions scheduled for today.
              </div>
            )}
          </div>
        </Card>

        {/* Active Panchakarma Regimens */}
        <Card
          title="Active Panchakarma Protocols"
          subtitle="Therapy stage progression and session counts"
          actions={
            <Button size="sm" variant="ghost" onClick={() => onNavigateTab('treatments')} rightIcon={<ArrowRight size={14} />}>
              All Protocols
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeTreatments.slice(0, 4).map((rx) => {
              const patientName = typeof rx.patientId === 'object' ? rx.patientId.full_name : 'Patient Record';
              const doctorName = typeof rx.doctorId === 'object' ? rx.doctorId.full_name : 'Doctor';
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
                    Prescribed by Dr. {doctorName} | Session {rx.progressCompleted || 0} of {rx.duration}
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-emerald)' }} />
                  </div>
                </div>
              );
            })}
            {activeTreatments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                No active therapy courses currently assigned.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TherapistDashboardPage;
