import React, { useState } from 'react';
import {
  User,
  Heart,
  Save,
  Check,
  Shield,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const PatientProfilePage: React.FC = () => {
  const { user, updateUserInContext } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [address, setAddress] = useState(user?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user?.allergies || 'None');
  const [condition, setCondition] = useState(user?.condition || 'Vata Imbalance');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await userService.updateProfile({
        phone,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        address,
        emergencyContact,
        bloodGroup,
        allergies,
        condition,
      });
      updateUserInContext(res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update health profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
          Personal Health Profile & Demographics
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
          Manage your contact information, emergency contacts, known allergies, and primary Prakriti
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card title="Patient Identity" subtitle="Basic registration and contact details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Full Name" value={user?.full_name || ''} disabled />
            <Input label="Email Address" value={user?.email || ''} disabled />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Phone Contact"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Age (Years)"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)', display: 'block', marginBottom: '0.375rem' }}>
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-slate-200)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Input
                label="Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 11111"
              />
            </div>

            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, Street, City"
            />
          </div>
        </Card>

        <Card title="Ayurvedic & Clinical Profile" subtitle="Vital biological markers and known contraindications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Primary Prakriti / Dosha Imbalance"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Vata-Pitta, Chronic Amavata"
              />
              <Input
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="O+, A+, B+"
              />
            </div>

            <Input
              label="Known Allergies & Sensitivities"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Sesame oil sensitivity, penicillin allergy"
            />
          </div>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={16} /> Profile saved successfully!
            </span>
          )}
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={16} />}>
            Save Health Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfilePage;
