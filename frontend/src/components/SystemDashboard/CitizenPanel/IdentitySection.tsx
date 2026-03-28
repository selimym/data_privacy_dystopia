import { useTranslation } from 'react-i18next'
import type { CitizenSkeleton } from '@/types/citizen'

interface IdentitySectionProps {
  skeleton: CitizenSkeleton
}

function formatSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }
  return ssn
}

export function IdentitySection({ skeleton }: IdentitySectionProps) {
  const { t } = useTranslation()

  const address = [skeleton.street_address, skeleton.city, skeleton.state, skeleton.zip_code]
    .filter(Boolean)
    .join(', ')

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 2,
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '6px 0',
    borderBottom: '1px solid var(--border-subtle)',
  }

  return (
    <div data-testid="identity-section" style={{ padding: '8px 0' }}>
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 4,
        }}
      >
        {t('citizen.identity.title')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0 16px',
        }}
      >
        <div style={fieldStyle}>
          <div style={labelStyle}>{t('citizen.identity.name')}</div>
          <div style={{ ...valueStyle, fontWeight: 700 }}>
            {skeleton.first_name} {skeleton.last_name}
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>{t('citizen.identity.dob')}</div>
          <div style={valueStyle}>{skeleton.date_of_birth}</div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>{t('citizen.identity.ssn')}</div>
          <div style={{ ...valueStyle, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            {formatSSN(skeleton.ssn)}
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>{t('citizen.identity.role')}</div>
          <div style={{ ...valueStyle, textTransform: 'uppercase', fontSize: 11 }}>
            {skeleton.role.replace('_', ' ')}
          </div>
        </div>

        <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
          <div style={labelStyle}>{t('citizen.identity.address')}</div>
          <div style={valueStyle}>{address}</div>
        </div>
      </div>
    </div>
  )
}
