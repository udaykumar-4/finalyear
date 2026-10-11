import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'var(--color-emerald)',
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-slate-200)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-slate-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              color: 'var(--color-slate-900)',
              marginTop: '0.25rem',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {value}
          </div>
        </div>
        {icon && (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-sage)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
        {trend && (
          <span
            style={{
              fontWeight: 700,
              color: trend.isPositive ? 'var(--color-success)' : 'var(--color-error)',
              backgroundColor: trend.isPositive ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              padding: '0.125rem 0.375rem',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            {trend.value}
          </span>
        )}
        {subtitle && <span style={{ color: 'var(--color-slate-500)' }}>{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatCard;
