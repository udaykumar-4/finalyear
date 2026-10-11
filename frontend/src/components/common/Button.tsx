import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-emerald)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-emerald)',
          boxShadow: '0 2px 4px rgba(4, 120, 87, 0.15)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-slate-100)',
          color: 'var(--color-slate-800)',
          border: '1px solid var(--color-slate-200)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-emerald)',
          border: '1.5px solid var(--color-emerald)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-error)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-slate-700)',
          border: '1px solid transparent',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.8125rem',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          borderRadius: 'var(--radius-md)',
        };
      case 'md':
      default:
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          borderRadius: 'var(--radius-md)',
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap', // Taste CTA button wrap ban
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  };

  return (
    <button disabled={disabled || isLoading} style={baseStyles} {...props}>
      {isLoading ? (
        <span
          style={{
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
