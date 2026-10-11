import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  padding = 'md',
  children,
  style,
  ...props
}) => {
  const getPaddingStyle = (): string => {
    switch (padding) {
      case 'none':
        return '0';
      case 'sm':
        return '1rem';
      case 'lg':
        return '2rem';
      case 'md':
      default:
        return '1.5rem';
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-slate-200)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow var(--transition-fast), border-color var(--transition-fast)',
        ...style,
      }}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-slate-100)',
            gap: '1rem',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-slate-900)',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-slate-500)',
                  marginTop: '0.125rem',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding: getPaddingStyle() }}>{children}</div>
    </div>
  );
};

export default Card;
