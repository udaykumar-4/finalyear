import React, { useState } from 'react';
import {
  Shield,
  Stethoscope,
  Activity,
  Building2,
  User,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface RoleOption {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  defaultEmail: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { role: 'admin', title: 'Administrator', subtitle: 'Manage users, schedules, analytics & security', icon: Shield, defaultEmail: 'admin@ayursutra.com' },
  { role: 'doctor', title: 'Doctor', subtitle: 'Patient charts, consultations, Rx & clinical AI', icon: Stethoscope, defaultEmail: 'doctor@ayursutra.com' },
  { role: 'therapist', title: 'Therapist', subtitle: 'Panchakarma sessions, protocols & progress', icon: Activity, defaultEmail: 'therapist@ayursutra.com' },
  { role: 'receptionist', title: 'Receptionist', subtitle: 'Walk-ins, scheduling, billing & payments', icon: Building2, defaultEmail: 'receptionist@ayursutra.com' },
  { role: 'patient', title: 'Patient', subtitle: 'Appointments, therapy journey & wellness AI', icon: User, defaultEmail: 'patient@ayursutra.com' },
];

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('patient@ayursutra.com');
  const [password, setPassword] = useState('password123');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const opt = ROLE_OPTIONS.find((r) => r.role === role);
    if (opt && !isRegister) {
      setEmail(opt.defaultEmail);
      setPassword('password123');
    }
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      if (isRegister) {
        if (!fullName) {
          setFormError('Please provide your full legal name.');
          return;
        }
        await register({
          full_name: fullName,
          email,
          password,
          role: selectedRole,
          designation: designation || undefined,
          phone: phone || undefined,
        });
      } else {
        await login({
          email,
          password,
          role: selectedRole,
        });
      }
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-cream)',
        padding: '2rem 1rem',
        backgroundImage: 'radial-gradient(var(--color-sage-border) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '2rem',
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-slate-200)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Left: Role Selection & Presentation */}
        <div
          style={{
            padding: '2.5rem',
            backgroundColor: 'var(--color-slate-50)',
            borderRight: '1px solid var(--color-slate-200)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--color-emerald) 0%, var(--color-forest) 100%)',
                  color: 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-forest)', lineHeight: 1.1 }}>
                  AyurSutra
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                  Intelligent Panchakarma Management Platform
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '1.25rem' }}>
              Select your authenticated clinical or patient persona to continue:
            </p>

            {/* Persona Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {ROLE_OPTIONS.map((r) => {
                const isSelected = selectedRole === r.role;
                const IconComponent = r.icon;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r.role)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? 'var(--color-emerald)' : 'var(--color-slate-200)'}`,
                      backgroundColor: isSelected ? 'var(--color-sage)' : 'var(--color-white)',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--color-emerald)' : 'var(--color-slate-100)',
                        color: isSelected ? 'var(--color-white)' : 'var(--color-slate-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: isSelected ? 'var(--color-forest)' : 'var(--color-slate-800)' }}>
                          {r.title}
                        </span>
                        {isSelected && (
                          <CheckCircle size={16} style={{ color: 'var(--color-emerald)' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--color-emerald)' : 'var(--color-slate-500)', display: 'block' }}>
                        {r.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Fill Helper */}
          <div style={{ marginTop: '1.5rem', padding: '0.875rem', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-slate-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
              <Info size={14} style={{ color: 'var(--color-emerald)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pre-configured Demo Accounts
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
              Password for all seeded accounts is: <strong>password123</strong>
            </span>
          </div>
        </div>

        {/* Right: Login / Registration Form */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-slate-100)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                clearError();
              }}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                backgroundColor: !isRegister ? 'var(--color-white)' : 'transparent',
                color: !isRegister ? 'var(--color-forest)' : 'var(--color-slate-600)',
                boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                clearError();
              }}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                backgroundColor: isRegister ? 'var(--color-white)' : 'transparent',
                color: isRegister ? 'var(--color-forest)' : 'var(--color-slate-600)',
                boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Register New Account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                {isRegister ? `Register as ${selectedRole}` : `Sign In as ${selectedRole}`}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
                {isRegister
                  ? 'Create an account to access Ayurvedic health records and treatments.'
                  : 'Enter your credentials to enter the clinical management portal.'}
              </p>
            </div>

            {/* Error Banners */}
            {(formError || error) && (
              <div
                style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--color-error-bg)',
                  border: '1px solid var(--color-error-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{formError || error}</span>
              </div>
            )}

            {isRegister && (
              <Input
                label="Full Name"
                placeholder="Dr. Ananya Sharma or Aarav Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@ayursutra.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {isRegister && (selectedRole === 'doctor' || selectedRole === 'therapist') && (
              <Input
                label="Clinical Designation"
                placeholder="e.g. Senior Ayurvedic Physician"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
              rightIcon={<ArrowRight size={18} />}
            >
              {isRegister ? 'Complete Registration' : 'Authorize & Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
