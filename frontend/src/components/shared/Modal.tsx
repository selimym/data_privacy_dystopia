import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  'data-testid'?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  'data-testid': testId,
}: ModalProps) {
  // ESC key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.72)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderTop: '2px solid var(--color-blue)',
    minWidth: 400,
    maxWidth: 640,
    width: '90vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  }

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-primary)',
    fontWeight: 600,
  }

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    lineHeight: 1,
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  }

  const bodyStyle: React.CSSProperties = {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  }

  return (
    <div
      style={overlayStyle}
      data-testid={testId}
      onClick={(e) => {
        // Close when clicking outside the panel
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={panelStyle} role="dialog" aria-modal="true" aria-label={title}>
        <div style={headerStyle}>
          <span style={titleStyle}>{title}</span>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            data-testid={testId ? `${testId}-close` : 'modal-close'}
            aria-label="Close"
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
            }}
          >
            ✕
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  )
}
