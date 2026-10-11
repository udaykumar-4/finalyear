import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Play,
  User,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const TherapistSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments({ therapistId: user._id });
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load therapy schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [user]);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, status);
      loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Failed to update session status.');
    }
  };

  const filtered = appointments.filter((a) => {
    const dStr = new Date(a.appointment_date).toISOString().split('T')[0];
    return dStr === selectedDate;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Daily Therapy Session Schedule
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Manage room preparations, patient intake, and Panchakarma execution times
          </p>
        </div>
        <div style={{ width: '200px' }}>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
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

      {/* Session Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((s, idx) => {
          const patientName = typeof s.patientId === 'object' ? s.patientId.full_name : 'Patient Record';
          const isDone = s.status === 'completed';
          const isInProgress = s.status === 'in-progress';
          return (
            <Card key={s._id} padding="md">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isDone ? 'var(--color-success-bg)' : isInProgress ? 'var(--color-warning-bg)' : 'var(--color-sage)',
                      color: isDone ? 'var(--color-success)' : isInProgress ? 'var(--color-warning)' : 'var(--color-forest)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                        {patientName}
                      </span>
                      <span className="badge badge-success">{s.treatment}</span>
                      <span
                        className={`badge ${
                          isDone ? 'badge-success' : isInProgress ? 'badge-warning' : 'badge-info'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                      Time Slot: <strong>{s.appointment_time}</strong> | Therapy Suite: <strong>Room {((idx % 4) + 1)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {s.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(s._id, 'in-progress')}
                      leftIcon={<Play size={14} />}
                    >
                      Begin Session
                    </Button>
                  )}
                  {s.status === 'in-progress' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(s._id, 'completed')}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {isDone && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={16} /> Session Concluded
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: 'var(--color-slate-400)', padding: '2rem 0' }}>
              No therapy sessions scheduled on {selectedDate}.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TherapistSchedulePage;
