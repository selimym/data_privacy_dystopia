import { useMetricsStore } from '@/stores/metricsStore'

export function ReluctanceWarning() {
  const reluctance = useMetricsStore(s => s.reluctance)

  if (!reluctance.formal_warning_issued) return null

  return (
    <div
      data-testid="reluctance-warning"
      style={{
        marginBottom: 8,
        padding: '10px 10px 8px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid var(--color-red)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-red)',
          letterSpacing: '0.1em',
          marginBottom: 4,
          fontWeight: 700,
        }}
      >
        ⚠ PERFORMANCE WARNING
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-red)',
          marginBottom: 4,
          letterSpacing: '0.05em',
        }}
      >
        Reluctance score: {reluctance.reluctance_score}
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'rgba(239, 68, 68, 0.8)',
          lineHeight: 1.4,
        }}
      >
        Your hesitation patterns have been flagged.
      </div>
    </div>
  )
}
