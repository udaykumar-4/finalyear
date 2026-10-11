import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export interface PatientAppointmentsPageProps {
  onOpenBookingModal: () => void;
}

export const PatientAppointmentsPage: React.FC<PatientAppointmentsPageProps> = ({
  onOpenBookingModal,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments({ patientId: user._id });
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load your appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment slot?')) return;
    try {
      await appointmentService.deleteAppointment(id);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  const upcoming = appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const past = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            My Consultations & Therapy Sessions
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            View your upcoming Panchakarma appointments, schedule new visits, or make changes
          </p>
        </div>
        <Button variant="primary" onClick={onOpenBookingModal} leftIcon={<Plus size={16} />}>
          Book New Appointment
        </Button>
      </div>

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

      {/* Upcoming Section */}
      <Card title="Upcoming Appointments" subtitle="Sessions confirmed on your clinic calendar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {upcoming.map((a) => (
            <div
              key={a._id}
              style={{
                padding: '1.25rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    {a.treatment}
                  </span>
                  <span className="badge badge-info">{a.status}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} />
                  <span>
                    {new Date(a.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <Clock size={14} style={{ marginLeft: '0.5rem' }} />
                  <span>{a.appointment_time}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${a.isPaid ? 'badge-success' : 'badge-warning'}`}>
                  {a.isPaid ? 'PAID' : 'PAY AT CLINIC'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelAppointment(a._id)}
                  style={{ color: 'var(--color-error)' }}
                  leftIcon={<Trash2 size={14} />}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}

          {upcoming.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-slate-400)' }}>
              No upcoming appointments. Schedule your next consultation above.
            </div>
          )}
        </div>
      </Card>

      {/* Past History */}
      {past.length > 0 && (
        <Card title="Past Session History" subtitle="Concluded or cancelled therapy visits">
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {past.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span style={{ fontWeight: 700 }}>{a.treatment}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)' }}>
                        {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-neutral'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.isPaid ? 'badge-success' : 'badge-warning'}`}>
                        {a.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
