import React from 'react'
import { useTranslation } from 'react-i18next'
import type { CountryProfile } from '@/types/content'

interface CountryCardProps {
  country: CountryProfile
  isSelected: boolean
  onSelect: () => void
}

export function CountryCard({ country, isSelected, onSelect }: CountryCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = React.useState(false)

  const cardStyle: React.CSSProperties = {
    background: hovered
      ? 'var(--bg-tertiary)'
      : isSelected
        ? 'var(--bg-tertiary)'
        : 'var(--bg-secondary)',
    border: isSelected
      ? '1px solid var(--color-blue)'
      : '1px solid var(--border-subtle)',
    borderRadius: '4px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    boxShadow: isSelected
      ? '0 0 0 1px var(--color-blue-dim), 0 0 12px rgba(37, 99, 235, 0.15)'
      : 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    userSelect: 'none',
  }

  const flagStyle: React.CSSProperties = {
    fontSize: '32px',
    lineHeight: 1,
  }

  const countryNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 600,
    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  const agencyNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  }

  const depthLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginTop: '4px',
  }

  const depthBarsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '3px',
    alignItems: 'center',
    marginTop: '2px',
  }

  const getBarStyle = (barIndex: number): React.CSSProperties => ({
    width: '20px',
    height: '4px',
    borderRadius: '1px',
    background: barIndex < country.surveillance_depth
      ? 'var(--color-amber)'
      : 'var(--border-subtle)',
    transition: 'background 0.15s',
  })

  const depthTextStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: 'var(--color-amber)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginLeft: '6px',
  }

  return (
    <div
      style={cardStyle}
      data-testid={`country-select-${country.country_key}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div style={flagStyle}>{country.flag_emoji}</div>
      <div style={countryNameStyle}>{country.display_name}</div>
      <div style={agencyNameStyle}>{country.ui_flavor.agency_name}</div>
      <div>
        <div style={depthLabelStyle}>{t('start.surveillance_depth')}</div>
        <div style={depthBarsContainerStyle}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={getBarStyle(i)} />
          ))}
          <span style={depthTextStyle}>
            {t(`start.depth.${country.surveillance_depth}`)}
          </span>
        </div>
      </div>
    </div>
  )
}
