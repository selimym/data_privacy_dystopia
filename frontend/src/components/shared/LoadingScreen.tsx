import React from 'react'
import { useTranslation } from 'react-i18next'

export function LoadingScreen() {
  const { t } = useTranslation()
  const [cursorVisible, setCursorVisible] = React.useState(true)

  // Blinking cursor
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    zIndex: 9000,
  }

  const textStyle: React.CSSProperties = {
    fontSize: '13px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  }

  const cursorStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '8px',
    height: '1em',
    background: 'var(--text-secondary)',
    marginLeft: '4px',
    verticalAlign: 'text-bottom',
    opacity: cursorVisible ? 1 : 0,
  }

  const subStyle: React.CSSProperties = {
    marginTop: '16px',
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'var(--text-muted)',
  }

  return (
    <div style={containerStyle} data-testid="loading-screen">
      <div style={textStyle}>
        {t('app.loading', 'LOADING CIVIC HARMONY PLATFORM...')}
        <span style={cursorStyle} />
      </div>
      <div style={subStyle}>
        {t('app.loading_sub', 'INITIALIZING SECURE CONNECTION')}
      </div>
    </div>
  )
}
