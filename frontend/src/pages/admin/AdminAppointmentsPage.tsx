import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Trash2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export interface AdminAppointmentsPageProps {
  onOpenBookingModal: () => void;
}

export const AdminAppointmentsPage: React.FC<AdminAppointmentsPageProps> = ({
  onOpenBookingModal,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  const handleTogglePayment = async (id: string, currentPaid: boolean) => {
    try {
      await appointmentService.updatePaymentStatus(id, !currentPaid);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this booking?')) return;
    try {
      await appointmentService.deleteAppointment(id);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete appointment.');
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const patientName = typeof a.patientId === 'object' ? a.patientId.full_name : '';
    const matchesQuery =
      !q ||
      patientName.toLowerCase().includes(q) ||
      a.treatment.toLowerCase().includes(q) ||
      a.appointment_time.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Clinical Appointment Schedule
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Supervise doctor consultations, Panchakarma therapy sessions, and payment locks
          </p>
        </div>
        <Button variant="primary" onClick={onOpenBookingModal} leftIcon={<Plus size={16} />}>
          Schedule New Session
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
              placeholder="Search by patient or therapy..."
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
                <th>Therapy / Reason</th>
                <th>Scheduled Date & Time</th>
                <th>Status Management</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => {
                const patientName = typeof app.patientId === 'object' ? app.patientId.full_name : 'Patient Record';
                const dateStr = new Date(app.appointment_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <tr key={app._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{patientName}</div>
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
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(app._id, !!app.isPaid)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: app.isPaid ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                          color: app.isPaid ? 'var(--color-success)' : 'var(--color-warning)',
                          border: `1px solid ${app.isPaid ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <CreditCard size={12} />
                        <span>{app.isPaid ? 'PAID' : 'PENDING'}</span>
                      </button>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(app._id)}
                        title="Delete booking"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No appointments match the selected filter.
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

export default AdminAppointmentsPage;
