/**
 * TopBar — view switcher (CASE REVIEW | NEWS FEED | WORLD MAP) + operator info.
 * Replaces the old DashboardHeader as the primary navigation bar.
 */
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import type { DashboardView } from '@/stores/uiStore'

const VIEWS: { key: DashboardView; label: string }[] = [
  { key: 'case-review', label: 'CASE REVIEW' },
  { key: 'news-feed', label: 'NEWS FEED' },
  { key: 'world-map', label: '🗺 WORLD MAP' },
]

export default function TopBar() {
  const currentView = useUIStore(s => s.currentView)
  const setView = useUIStore(s => s.setView)
  const weekNumber = useGameStore(s => s.weekNumber)
  const operator = useGameStore(s => s.operator)

  return (
    <div
      data-testid="dashboard-header"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Platform name */}
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 10,
          letterSpacing: '0.15em',
          whiteSpace: 'nowrap',
        }}
      >
        CIVIC HARMONY v2.0
      </span>

      {/* View switcher — centred */}
      <div style={{ display: 'flex', gap: 4, margin: '0 auto' }}>
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            data-testid={`view-btn-${key}`}
            onClick={() => setView(key)}
            style={{
              background: 'transparent',
              border: `1px solid ${currentView === key ? 'var(--color-green)' : 'var(--border-subtle)'}`,
              color: currentView === key ? 'var(--color-green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              padding: '3px 10px',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Operator info */}
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 10,
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}
      >
        {operator?.operator_code ?? 'SYS-OP-001'} · WK{' '}
        <span data-testid="week-indicator">{weekNumber}</span>
      </span>
    </div>
  )
}
