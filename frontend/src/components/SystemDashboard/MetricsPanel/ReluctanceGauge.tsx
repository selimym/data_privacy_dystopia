import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'

export function ReluctanceGauge() {
  const { t } = useTranslation()
  const reluctance = useMetricsStore(s => s.reluctance)
  const score = reluctance.reluctance_score
  const hasWarning = reluctance.warnings_received > 0

  const borderStyle =
    score >= 90 ? '1px solid var(--color-red)' :
    score >= 70 ? '1px solid var(--color-amber)' :
    '1px solid transparent'

  const scoreColor =
    score >= 90 ? 'var(--color-red)' :
    score >= 70 ? 'var(--color-amber)' :
    'var(--color-red)'

  // Reluctance bar is always red — higher is worse
  const barColor = 'var(--color-red)'

  return (
    <div
      data-testid="reluctance-gauge"
      style={{
        marginBottom: 12,
        border: borderStyle,
        borderRadius: 2,
        padding: score >= 70 ? '6px 6px 4px' : 0,
        transition: 'border 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {t('metrics.reluctance.title')}
          </span>
          {hasWarning && (
            <span
              data-testid="reluctance-warning-badge"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'var(--color-amber)',
                background: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid var(--color-amber)',
                borderRadius: 2,
                padding: '1px 4px',
                letterSpacing: '0.08em',
              }}
            >
              ⚠ {reluctance.warnings_received}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: scoreColor,
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
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
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
