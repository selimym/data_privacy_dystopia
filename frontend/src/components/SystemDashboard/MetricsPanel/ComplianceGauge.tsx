import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'

export function ComplianceGauge() {
  const { t } = useTranslation()
  const score = useMetricsStore(s => s.compliance_score)

  const barColor =
    score >= 75 ? 'var(--color-green)' :
    score >= 50 ? 'var(--color-amber)' :
    'var(--color-red)'

  return (
    <div data-testid="compliance-gauge" style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
          }}
        >
          {t('metrics.compliance.title')}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: barColor,
            fontWeight: 700,
          }}
        >
          {score}
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'var(--bg-tertiary)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.4s ease, background 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          marginTop: 2,
          textAlign: 'right',
        }}
      >
        {score}%
      </div>
    </div>
  )
}
