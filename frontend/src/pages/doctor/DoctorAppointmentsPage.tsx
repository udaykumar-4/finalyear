import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export interface DoctorAppointmentsPageProps {
  onOpenClinicalSupport: (patientId: string, patientName: string) => void;
  onOpenBookingModal: () => void;
}

export const DoctorAppointmentsPage: React.FC<DoctorAppointmentsPageProps> = ({
  onOpenClinicalSupport,
  onOpenBookingModal,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments({ doctorId: user._id });
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor consultation schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update consultation status.');
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const patientName = typeof a.patientId === 'object' ? a.patientId.full_name : '';
    const matchesQuery = !q || patientName.toLowerCase().includes(q) || a.treatment.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Consultation Schedule
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Your clinical consultations, diagnostic review sessions, and follow-ups
          </p>
        </div>
        <Button variant="primary" onClick={onOpenBookingModal} leftIcon={<Calendar size={16} />}>
          Schedule Consultation
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

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((status) => {
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: `1px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                    backgroundColor: isSelected ? 'var(--color-emerald)' : 'var(--color-white)',
                    color: isSelected ? 'var(--color-white)' : 'var(--color-slate-600)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Consultation Type</th>
                <th>Appointment Time</th>
                <th>Status Management</th>
                <th>AI Support</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const patientName = typeof app.patientId === 'object' ? app.patientId.full_name : 'Patient Record';
                const patientId = typeof app.patientId === 'object' ? app.patientId._id : app.patientId;
                const dateStr = new Date(app.appointment_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <tr key={app._id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>{patientName}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{app.treatment}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)', fontWeight: 600 }}>
                        {dateStr}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {app.appointment_time}
                      </div>
                    </td>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app._id, e.target.value as AppointmentStatus)}
                        style={{
                          padding: '0.3125rem 0.625rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid var(--color-slate-200)',
                          backgroundColor:
                            app.status === 'completed'
                              ? 'var(--color-success-bg)'
                              : app.status === 'cancelled'
                              ? 'var(--color-error-bg)'
                              : 'var(--color-white)',
                          color:
                            app.status === 'completed'
                              ? 'var(--color-success)'
                              : app.status === 'cancelled'
                              ? 'var(--color-error)'
                              : 'var(--color-slate-800)',
                        }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenClinicalSupport(patientId, patientName)}
                        leftIcon={<Sparkles size={14} />}
                      >
                        AI Support
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No consultation sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DoctorAppointmentsPage;
