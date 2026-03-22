import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'

interface MetricRowProps {
  label: string
  value: number
  barColor: string
  arrowColor: string
  testId: string
}

function MetricRow({ label, value, barColor, arrowColor, testId }: MetricRowProps) {
  return (
    <div data-testid={testId} style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: arrowColor,
            fontWeight: 600,
          }}
        >
          {value} <span style={{ fontSize: 10 }}>↑</span>
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          width: '100%',
          height: 4,
          background: 'var(--bg-tertiary)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

export function PublicMetricsDisplay() {
  const { t } = useTranslation()
  const metrics = useMetricsStore(s => s.public_metrics)

  return (
    <div data-testid="public-metrics-display">
      <MetricRow
        label={t('metrics.awareness.label')}
        value={metrics.international_awareness}
        barColor="var(--color-amber)"
        arrowColor="var(--color-amber)"
        testId="awareness-metric"
      />
      <MetricRow
        label={t('metrics.anger.label')}
        value={metrics.public_anger}
        barColor="var(--color-red)"
        arrowColor="var(--color-red)"
        testId="anger-metric"
      />
    </div>
  )
}
