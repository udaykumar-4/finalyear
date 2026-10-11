import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Phone,
  Save,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const ReceptionistSettingsPage: React.FC = () => {
  const { user, updateUserInContext } = useAuth();
  const [designation, setDesignation] = useState(user?.designation || 'Front Desk Officer');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await userService.updateProfile({ designation, phone });
      updateUserInContext(res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update front desk profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Front Desk Staff Profile & Station Settings
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Manage your desk station profile, emergency phone extensions, and contact details
        </p>
      </div>

      <Card title="Front Desk Officer Profile" subtitle="Your clinic personnel information">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Staff Name" value={user?.full_name || ''} disabled />
          <Input label="Email Address" value={user?.email || ''} disabled />
          <Input
            label="Desk Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
          <Input
            label="Direct Extension / Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            {saveSuccess && (
              <span style={{ color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={16} /> Preferences updated!
              </span>
            )}
            <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={16} />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReceptionistSettingsPage;
