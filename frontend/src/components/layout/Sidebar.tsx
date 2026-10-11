import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Activity,
  Stethoscope,
  Pill,
  Clock,
  CreditCard,
  MessageSquare,
  Sparkles,
  User,
  LogOut,
  Shield,
  Building2,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'appointments', label: 'All Appointments', icon: Calendar },
    { id: 'reports', label: 'Clinical Analytics', icon: FileText },
    { id: 'settings', label: 'Clinic Settings', icon: Settings },
  ],
  doctor: [
    { id: 'dashboard', label: 'Consultations', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Charts & AI', icon: Users },
    { id: 'appointments', label: 'My Schedule', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'profile', label: 'Doctor Profile', icon: Stethoscope },
  ],
  therapist: [
    { id: 'dashboard', label: 'Therapy Overview', icon: LayoutDashboard },
    { id: 'schedule', label: 'Daily Sessions', icon: Clock },
    { id: 'treatments', label: 'Panchakarma Protocols', icon: Activity },
    { id: 'patients', label: 'Assigned Patients', icon: Users },
    { id: 'profile', label: 'Therapist Profile', icon: User },
  ],
  receptionist: [
    { id: 'dashboard', label: 'Front Desk', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments & Check-in', icon: Calendar },
    { id: 'patients', label: 'Patient Intake', icon: Users },
    { id: 'payments', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'settings', label: 'Desk Settings', icon: Settings },
  ],
  patient: [
    { id: 'dashboard', label: 'My Wellness', icon: LayoutDashboard },
    { id: 'appointments', label: 'My Bookings', icon: Calendar },
    { id: 'treatments', label: 'Panchakarma Journey', icon: Activity },
    { id: 'reports', label: 'Medical Records', icon: FileText },
    { id: 'feedback', label: 'Session Feedback', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const role: UserRole = user?.role || 'patient';
  const navItems = ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.patient;

  const roleLabels: Record<UserRole, { title: string; badge: string; icon: LucideIcon }> = {
    admin: { title: 'Administrator', badge: 'Superuser', icon: Shield },
    doctor: { title: 'Ayurvedic Physician', badge: 'Doctor', icon: Stethoscope },
    therapist: { title: 'Panchakarma Specialist', badge: 'Therapist', icon: Activity },
    receptionist: { title: 'Front Desk Officer', badge: 'Reception', icon: Building2 },
    patient: { title: 'Patient Member', badge: 'Patient', icon: User },
  };

  const currentRoleInfo = roleLabels[role];
  const RoleIcon = currentRoleInfo.icon;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          width: '270px',
          height: '100vh',
          backgroundColor: 'var(--color-white)',
          borderRight: '1px solid var(--color-slate-200)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          transform: isOpenMobile ? 'translateX(0)' : undefined,
          transition: 'transform var(--transition-smooth)',
        }}
        className={isOpenMobile ? 'sidebar-open' : 'sidebar-desktop'}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-emerald) 0%, var(--color-forest) 100%)',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(4, 120, 87, 0.25)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest)', lineHeight: 1.1 }}>
              AyurSutra
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Panchakarma OS
            </div>
          </div>
        </div>

        {/* User Persona Chip */}
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-slate-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-sage)',
                color: 'var(--color-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1.5px solid var(--color-sage-border)',
              }}
            >
              <RoleIcon size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'AyurSutra User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}>
                  {currentRoleInfo.badge}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.designation || user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.875rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.75rem', marginBottom: '0.25rem' }}>
            Navigation
          </span>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6875rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-sage)' : 'transparent',
                  color: isActive ? 'var(--color-forest)' : 'var(--color-slate-600)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                  border: `1px solid ${isActive ? 'var(--color-sage-border)' : 'transparent'}`,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconComponent size={18} style={{ color: isActive ? 'var(--color-emerald)' : 'var(--color-slate-400)' }} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} style={{ color: 'var(--color-emerald)' }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-slate-100)', backgroundColor: 'var(--color-white)' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'transparent',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-error-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
