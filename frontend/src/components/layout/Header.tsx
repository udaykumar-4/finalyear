import React from 'react';
import { Menu, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  onOpenAIChat?: () => void;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenAIChat,
  actionButton,
}) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: '72px',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="mobile-only-btn"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-slate-200)',
              color: 'var(--color-slate-700)',
              display: 'none',
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-slate-900)',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.125rem' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Backend Connectivity Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            backgroundColor: 'var(--color-sage)',
            border: '1px solid var(--color-sage-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.6875rem',
            color: 'var(--color-forest)',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-mint)',
              display: 'inline-block',
            }}
          />
          <span>API 5000 Connected</span>
        </div>

        {/* Global Ayurvedic AI Assistant Button */}
        {onOpenAIChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAIChat}
            leftIcon={<Sparkles size={15} />}
          >
            Ayurveda AI
          </Button>
        )}

        {actionButton}
      </div>
    </header>
  );
};

export default Header;
