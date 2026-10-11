import React, { useState } from 'react';
import { Shield, Clock, Building, Bell, Database, Check, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState('AyurSutra Panchakarma Center');
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('07:00 PM');
  const [therapyRooms, setTherapyRooms] = useState('6');
  const [slotDuration, setSlotDuration] = useState('60');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Clinic System Configuration
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Configure operational timings, panchakarma therapy rooms, and system governance
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Clinic Facility Details" subtitle="Public identification and room inventory">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Clinic Name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Number of Panchakarma Rooms"
                type="number"
                value={therapyRooms}
                onChange={(e) => setTherapyRooms(e.target.value)}
                required
              />
              <Input
                label="Default Session Duration (Minutes)"
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        <Card title="Operating Hours & Scheduling Limits" subtitle="Clinic calendar slot availability window">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Opening Time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              required
            />
            <Input
              label="Closing Time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card title="Database & Security Status" subtitle="Authenticated role protections and system health">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-slate-600)' }}>Database Connection</span>
              <span className="badge badge-success">MongoDB Atlas Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-slate-600)' }}>JWT Session Security</span>
              <span className="badge badge-success">Bearer Token Authorization</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-slate-600)' }}>AI Safety Controls</span>
              <span className="badge badge-info">Clinician Approval Required</span>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {isSaved && (
            <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={16} /> Preferences saved successfully!
            </span>
          )}
          <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
