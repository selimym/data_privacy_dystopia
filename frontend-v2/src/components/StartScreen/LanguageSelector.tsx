import { useTranslation } from 'react-i18next'

export function LanguageSelector() {
  const { t } = useTranslation()

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  }

  const labelStyle: React.CSSProperties = {
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: '3px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '3px 8px',
    cursor: 'not-allowed',
    opacity: 0.6,
  }

  return (
    <div style={containerStyle} data-testid="language-selector">
      <span style={labelStyle}>{t('start.select_language')}:</span>
      <select
        style={selectStyle}
        disabled
        value="en"
        onChange={() => {
          // Future: additional language support
        }}
      >
        <option value="en">English</option>
      </select>
    </div>
  )
}
