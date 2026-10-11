import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  style,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-slate-700)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {leftIcon && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-slate-400)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            paddingLeft: leftIcon ? '2.5rem' : '0.875rem',
            paddingRight: rightIcon ? '2.5rem' : '0.875rem',
            borderRadius: 'var(--radius-md)',
            border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-slate-200)'}`,
            backgroundColor: 'var(--color-white)',
            color: 'var(--color-slate-900)',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-emerald)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
              : '0 0 0 3px rgba(4, 120, 87, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-slate-200)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {rightIcon && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-slate-400)',
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
