import React from 'react'

interface BadgeProps {
  variant?: 'red' | 'amber' | 'green' | 'blue' | 'muted'
  children: React.ReactNode
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  red: {
    background: 'var(--color-red-dim)',
    color: 'var(--color-red)',
  },
  amber: {
    background: 'var(--color-amber-dim)',
    color: 'var(--color-amber)',
  },
  green: {
    background: 'var(--color-green-dim)',
    color: 'var(--color-green)',
  },
  blue: {
    background: 'var(--color-blue-dim)',
    color: 'var(--color-blue)',
  },
  muted: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
  },
}

export function Badge({ variant = 'muted', children }: BadgeProps) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '2px',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
  }

  return <span style={style}>{children}</span>
}
