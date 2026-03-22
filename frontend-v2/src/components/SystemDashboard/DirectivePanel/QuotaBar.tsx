import { useTranslation } from 'react-i18next'

interface QuotaBarProps {
  completed: number
  required: number
}

export function QuotaBar({ completed, required }: QuotaBarProps) {
  const { t } = useTranslation()

  const percent = required === 0 ? 100 : Math.min(100, Math.round((completed / required) * 100))
  const isComplete = completed >= required

  const barColor = isComplete
    ? 'var(--color-green)'
    : percent > 50
    ? 'var(--color-amber)'
    : 'var(--color-red)'

  const totalBlocks = 12
  const filledBlocks = Math.round((percent / 100) * totalBlocks)

  const blocks = Array.from({ length: totalBlocks }, (_, i) => i < filledBlocks)

  return (
    <div data-testid="quota-bar" style={{ marginTop: 8 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          marginBottom: 4,
        }}
      >
        {t('directive.quota.label')}: {completed} / {required}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
          }}
        >
          {blocks.map((filled, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 8,
                background: filled ? barColor : 'var(--bg-tertiary)',
                border: `1px solid ${filled ? barColor : 'var(--border-subtle)'}`,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: barColor,
            minWidth: 36,
            textAlign: 'right',
          }}
        >
          {percent}%
        </span>
      </div>
    </div>
  )
}
