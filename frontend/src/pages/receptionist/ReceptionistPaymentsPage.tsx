import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { paymentService } from '../../services/paymentService';
import { Appointment } from '../../types/appointment';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export const ReceptionistPaymentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleSettleCash = async (appointmentId: string) => {
    setSettlingId(appointmentId);
    try {
      const updated = await paymentService.settleCashPayment(appointmentId);
      loadAppointments();
      setActiveReceipt(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record cash payment.');
    } finally {
      setSettlingId(null);
    }
  };

  const filtered = appointments.filter((a) => {
    const isPaid = !!a.isPaid;
    const matchesFilter =
      filter === 'all' ? true : filter === 'paid' ? isPaid : !isPaid;
    const q = searchQuery.toLowerCase();
    const patientName = typeof a.patientId === 'object' ? a.patientId.full_name : '';
    return matchesFilter && (!q || patientName.toLowerCase().includes(q) || a.treatment.toLowerCase().includes(q));
  });

  const totalCollected = appointments
    .filter((a) => a.isPaid)
    .reduce((acc, a) => acc + (a.cost || 1500), 0);
  const totalPending = appointments
    .filter((a) => !a.isPaid && a.status !== 'cancelled')
    .reduce((acc, a) => acc + (a.cost || 1500), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Cash Desk, Invoicing & Receipts
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Record in-person cash and UPI payments, generate clinical invoices, and issue receipts
          </p>
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

      {/* Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-sage)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Settled Collections
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                ₹{totalCollected.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                Outstanding Receivables
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                ₹{totalPending.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: `1px solid ${filter === 'all' ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                backgroundColor: filter === 'all' ? 'var(--color-emerald)' : 'var(--color-white)',
                color: filter === 'all' ? 'var(--color-white)' : 'var(--color-slate-600)',
              }}
            >
              All Invoices
            </button>
            <button
              type="button"
              onClick={() => setFilter('unpaid')}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: `1px solid ${filter === 'unpaid' ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                backgroundColor: filter === 'unpaid' ? 'var(--color-emerald)' : 'var(--color-white)',
                color: filter === 'unpaid' ? 'var(--color-white)' : 'var(--color-slate-600)',
              }}
            >
              Pending Settlement
            </button>
            <button
              type="button"
              onClick={() => setFilter('paid')}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: `1px solid ${filter === 'paid' ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                backgroundColor: filter === 'paid' ? 'var(--color-emerald)' : 'var(--color-white)',
                color: filter === 'paid' ? 'var(--color-white)' : 'var(--color-slate-600)',
              }}
            >
              Settled / Paid
            </button>
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

      {/* Invoices Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Therapy Description</th>
                <th>Session Date</th>
                <th>Amount Due</th>
                <th>Status</th>
                <th>Desk Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const patientName = typeof a.patientId === 'object' ? a.patientId.full_name : 'Patient Record';
                const cost = a.cost || (a.treatment === 'Consultation' ? 500 : 1500);
                const isPaid = !!a.isPaid;
                return (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>{patientName}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{a.treatment}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
                        {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                        ₹{cost.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isPaid ? (
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={settlingId === a._id}
                            onClick={() => handleSettleCash(a._id)}
                          >
                            Collect Cash
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveReceipt(a)}
                            leftIcon={<Printer size={14} />}
                          >
                            Receipt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No billing records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt Modal */}
      {activeReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 80,
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
              maxWidth: '460px',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest)' }}>
                  AyurSutra Clinic
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  Official Payment Settlement Receipt
                </span>
              </div>
              <button type="button" onClick={() => setActiveReceipt(null)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem', borderBottom: '1px solid var(--color-slate-200)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>Receipt ID:</span>
                <span style={{ fontWeight: 700 }}>REC-{activeReceipt._id.slice(-6).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>Patient:</span>
                <span style={{ fontWeight: 700 }}>
                  {typeof activeReceipt.patientId === 'object' ? activeReceipt.patientId.full_name : 'Patient'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>Therapy Session:</span>
                <span style={{ fontWeight: 700 }}>{activeReceipt.treatment}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>Date:</span>
                <span>{new Date(activeReceipt.appointment_date).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>Payment Method:</span>
                <span className="badge badge-success">CASH SETTLED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--color-slate-900)' }}>
                <span>Total Amount Paid:</span>
                <span>₹{(activeReceipt.cost || (activeReceipt.treatment === 'Consultation' ? 500 : 1500)).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()} leftIcon={<Printer size={16} />}>
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistPaymentsPage;
