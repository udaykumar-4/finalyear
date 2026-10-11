import React, { useState } from 'react';
import {
  Stethoscope,
  Clock,
  Calendar,
  Trash2,
  Plus,
  Save,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const DoctorProfilePage: React.FC = () => {
  const { user, updateUserInContext } = useAuth();
  const [designation, setDesignation] = useState(user?.designation || 'Senior Ayurvedic Physician');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Block Slot State
  const [blockDate, setBlockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockTime, setBlockTime] = useState('02:00 PM');
  const [isBlocking, setIsBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await userService.updateProfile({ designation, phone });
      updateUserInContext(res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBlocking(true);
    setError(null);
    try {
      const res = await userService.blockSlot({ date: blockDate, time: blockTime });
      updateUserInContext(res);
    } catch (err: any) {
      setError(err.message || 'Failed to block slot.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockSlot = async (slotId?: string) => {
    if (!slotId) return;
    try {
      const res = await userService.unblockSlot(slotId);
      updateUserInContext(res);
    } catch (err: any) {
      setError(err.message || 'Failed to unblock slot.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Physician Profile & Consultation Availability
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Manage your credentials, direct contact info, and calendar blackout slots
        </p>
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

      {/* Profile Form */}
      <Card title="Physician Credentials" subtitle="Information visible to clinic front desk and patients">
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Physician Name" value={user?.full_name || ''} disabled />
          <Input label="Email Address" value={user?.email || ''} disabled />
          <Input
            label="Clinical Designation / Specialization"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
          <Input
            label="Phone Contact"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            {saveSuccess && (
              <span style={{ color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={16} /> Profile saved!
              </span>
            )}
            <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={16} />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Blocked Slots Management */}
      <Card title="Calendar Availability & Blocked Slots" subtitle="Lock out specific consultation hours for leave or procedures">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleBlockSlot} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <Input
                label="Date to Block"
                type="date"
                value={blockDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <Input
                label="Time Slot"
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                placeholder="02:00 PM"
                required
              />
            </div>
            <Button type="submit" variant="primary" isLoading={isBlocking} leftIcon={<Plus size={16} />}>
              Block Slot
            </Button>
          </form>

          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
              Currently Blocked Slots
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {user?.blockedSlots && user.blockedSlots.map((slot) => (
                <div
                  key={slot._id || `${slot.date}_${slot.time}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-slate-50)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} style={{ color: 'var(--color-slate-400)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                      {slot.date} at {slot.time}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleUnblockSlot(slot._id)}
                    title="Remove blocked slot"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {(!user?.blockedSlots || user.blockedSlots.length === 0) && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No slots currently blocked. Your full availability schedule is open.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DoctorProfilePage;
