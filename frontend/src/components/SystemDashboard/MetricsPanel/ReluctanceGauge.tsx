import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'

export function ReluctanceGauge() {
  const { t } = useTranslation()
  const reluctance = useMetricsStore(s => s.reluctance)
  const score = reluctance.reluctance_score
  const hasWarning = reluctance.warnings_received > 0

  // Tolerance is the inverse — how much room the operator has left
  const tolerance = 100 - score

  const barColor =
    score >= 70 ? 'var(--color-red)' :
    score >= 30 ? 'var(--color-amber)' :
    'var(--color-green)'

  const scoreColor =
    score >= 70 ? 'var(--color-red)' :
    score >= 30 ? 'var(--color-amber)' :
    'var(--text-muted)'

  const borderStyle =
    score >= 90 ? '1px solid var(--color-red)' :
    score >= 70 ? '1px solid var(--color-amber)' :
    '1px solid transparent'

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
          marginBottom: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
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
                fontSize: 11,
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
            fontSize: 16,
            color: scoreColor,
            fontWeight: 700,
          }}
        >
          {score}
        </span>
      </div>

      {/* Tolerance sub-label */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: 4,
          opacity: 0.7,
        }}
      >
        TOLERANCE: {tolerance}%
      </div>

      {/* Bar track — shows REMAINING tolerance, depletes as reluctance rises */}
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
            width: `${tolerance}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.4s ease, background 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
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
