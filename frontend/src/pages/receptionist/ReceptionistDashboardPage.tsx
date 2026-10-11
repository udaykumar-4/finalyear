import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  UserPlus,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export interface ReceptionistDashboardPageProps {
  onNavigateTab: (tabId: string) => void;
  onOpenBookingModal: () => void;
  onOpenRegisterModal: () => void;
}

export const ReceptionistDashboardPage: React.FC<ReceptionistDashboardPageProps> = ({
  onNavigateTab,
  onOpenBookingModal,
  onOpenRegisterModal,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appts, patients] = await Promise.all([
        appointmentService.getAppointments(),
        userService.getAllUsers('patient'),
      ]);
      setAppointments(appts);
      setPatientCount(patients.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load front desk dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === todayStr && a.status !== 'cancelled';
  });

  const pendingPayments = appointments.filter((a) => !a.isPaid && a.status !== 'cancelled');
  const completedAppts = appointments.filter((a) => a.status === 'completed');

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
              Front-Desk Operations
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Patient Intake, Smart Slots & Cash Desk
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-white)', lineHeight: 1.2 }}>
            Welcome, {user?.full_name || 'Front Desk Officer'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Check in arriving patients, register walk-ins, settle therapy invoices, and maintain appointment availability.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={onOpenRegisterModal}
            leftIcon={<UserPlus size={16} />}
          >
            Intake Patient
          </Button>
          <Button
            variant="primary"
            onClick={onOpenBookingModal}
            leftIcon={<Calendar size={16} />}
            style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-forest)', border: 'none' }}
          >
            Book Walk-in
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
          title="Today's Arrivals"
          value={todayAppts.length}
          subtitle={`${appointments.length} total clinic bookings`}
          icon={<Clock size={22} />}
          accentColor="var(--color-emerald)"
        />
        <StatCard
          title="Registered Patients"
          value={patientCount}
          subtitle="Patient records in clinic registry"
          icon={<Users size={22} />}
          accentColor="var(--color-forest)"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments.length}
          subtitle="Sessions awaiting cash/UPI settlement"
          icon={<CreditCard size={22} />}
          accentColor="var(--color-amber)"
        />
        <StatCard
          title="Completed Sessions"
          value={completedAppts.length}
          subtitle="Successfully concluded therapies"
          icon={<CheckCircle2 size={22} />}
          accentColor="var(--color-emerald)"
        />
      </div>

      {/* Today's Front-Desk Arrivals Queue */}
      <Card
        title="Today's Patient Check-in Queue"
        subtitle="Arrival check-in, provider routing, and status transitions"
        actions={
          <Button size="sm" variant="ghost" onClick={() => onNavigateTab('appointments')} rightIcon={<ArrowRight size={14} />}>
            All Front Desk
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todayAppts.map((a) => {
            const patientName = typeof a.patientId === 'object' ? a.patientId.full_name : 'Patient Record';
            const isConfirmed = a.status === 'confirmed';
            const isScheduled = a.status === 'scheduled';
            return (
              <div
                key={a._id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-slate-200)',
                  backgroundColor: 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-slate-900)', fontSize: '1rem' }}>
                    {patientName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.125rem' }}>
                    {a.treatment} at <strong>{a.appointment_time}</strong> | Payment:{' '}
                    <span style={{ fontWeight: 700, color: a.isPaid ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {a.isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                    {a.status}
                  </span>
                  {isScheduled && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(a._id, 'confirmed')}
                    >
                      Patient Arrived / Check-in
                    </Button>
                  )}
                  {isConfirmed && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUpdateStatus(a._id, 'in-progress')}
                    >
                      Send to Therapy Room
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {todayAppts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
              No arriving patients recorded for today.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReceptionistDashboardPage;
