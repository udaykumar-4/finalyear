import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  AlertCircle,
  X,
  Stethoscope,
  CheckCircle,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { User } from '../../types/user';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export interface ReceptionistPatientsPageProps {
  onOpenBookingModal: () => void;
}

export const ReceptionistPatientsPage: React.FC<ReceptionistPatientsPageProps> = ({
  onOpenBookingModal,
}) => {
  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Patient Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [address, setAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers('patient');
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patient directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setModalError(null);
    try {
      await authService.register({
        full_name: name,
        email,
        password,
        role: 'patient',
        phone: phone || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        address: address || undefined,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setAge('');
      setAddress('');
      loadPatients();
    } catch (err: any) {
      setModalError(err.message || 'Failed to register patient.');
    } finally {
      setIsRegistering(false);
    }
  };

  const filtered = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
            Patient Intake & Registration
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)' }}>
            Create patient accounts, record emergency contacts, and book initial assessments
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsModalOpen(true);
            setModalError(null);
          }}
          leftIcon={<UserPlus size={16} />}
        >
          Register Walk-in Patient
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

      {/* Search */}
      <Card padding="sm">
        <div style={{ maxWidth: '320px' }}>
          <Input
            placeholder="Search by patient name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Demographics</th>
                <th>Contact</th>
                <th>Primary Health Status</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--color-slate-900)' }}>{p.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{p.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
                      {p.gender || 'Not specified'} {p.age ? `(${p.age} yrs)` : ''}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
                      {p.phone || 'No phone'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {p.condition || 'New Assessment'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active Member'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate-400)' }}>
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Intake Modal */}
      {isModalOpen && (
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
              maxWidth: '540px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-slate-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                New Patient Intake
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ color: 'var(--color-slate-400)' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-error-bg)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterPatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Full Legal Name"
                placeholder="Aarav Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Age"
                  type="number"
                  placeholder="34"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
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
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <Input
                label="Residential Address"
                placeholder="Koramangala, Bengaluru"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isRegistering}>
                  Complete Intake
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistPatientsPage;
