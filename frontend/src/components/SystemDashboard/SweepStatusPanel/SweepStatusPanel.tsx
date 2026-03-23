import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'

export function SweepStatusPanel() {
  const raidRecords = useGameStore(s => s.raidRecords)
  const currentDirective = useGameStore(s => s.currentDirective)
  const neighborhoods = useContentStore(s => s.country?.neighborhoods ?? [])

  const directiveRaids = raidRecords.filter(
    r => r.directive_key === (currentDirective?.directive_key ?? ''),
  )
  const totalArrests = directiveRaids.reduce((sum, r) => sum + r.actual_arrests, 0)
  const quota = currentDirective?.flag_quota ?? 0
  const quotaPercent = quota > 0 ? Math.min(100, (totalArrests / quota) * 100) : 0

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        SWEEP STATUS
      </div>

      <div style={{ padding: '16px 12px' }}>
        {/* Arrest count */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              marginBottom: 4,
            }}
          >
            ARRESTS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 28,
              fontWeight: 700,
              color: totalArrests >= quota ? 'var(--color-green)' : 'var(--color-red)',
              lineHeight: 1,
            }}
          >
            {totalArrests}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            / {quota} REQUIRED
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 4,
              background: 'var(--bg-tertiary)',
              borderRadius: 2,
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${quotaPercent}%`,
                background: totalArrests >= quota ? 'var(--color-green)' : 'var(--color-red)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Raids executed */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              marginBottom: 4,
            }}
          >
            RAIDS EXECUTED
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {directiveRaids.length}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            / {neighborhoods.length} NEIGHBORHOODS
          </div>
        </div>

        {/* Executed raid list */}
        {directiveRaids.length > 0 && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: 6,
              }}
            >
              EXECUTED
            </div>
            {directiveRaids.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '65%',
                  }}
                >
                  {r.neighborhood_name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-red)',
                    flexShrink: 0,
                  }}
                >
                  +{r.actual_arrests}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
