import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  'data-testid'?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  sm: { padding: '3px 8px', fontSize: '10px' },
  md: { padding: '6px 14px', fontSize: '11px' },
  lg: { padding: '9px 20px', fontSize: '13px' },
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--color-blue)',
    color: '#ffffff',
    border: '1px solid var(--color-blue)',
  },
  danger: {
    background: 'var(--color-red-dim)',
    color: 'var(--color-red)',
    border: '1px solid var(--color-red)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid transparent',
  },
}

export function Button({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  'data-testid': testId,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)

  const hoverOverride: React.CSSProperties = hovered && !disabled
    ? variant === 'ghost'
      ? { color: 'var(--text-primary)' }
      : variant === 'primary'
        ? { filter: 'brightness(1.15)' }
        : { borderColor: 'var(--border-strong)', filter: 'brightness(1.1)' }
    : {}

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'filter 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    borderRadius: 'var(--radius-sm)',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...hoverOverride,
  }

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}
