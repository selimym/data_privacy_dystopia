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
  { key: 'world-map', label: 'WORLD MAP' },
]

export default function TopBar() {
  const currentView = useUIStore(s => s.currentView)
  const setView = useUIStore(s => s.setView)
  const lastNewsViewedAt = useUIStore(s => s.lastNewsViewedAt)
  const weekNumber = useGameStore(s => s.weekNumber)
  const operator = useGameStore(s => s.operator)
  const newsArticles = useGameStore(s => s.newsArticles)

  // Badge: any article published after the last time user viewed the news feed
  const hasUnreadNews = newsArticles.some(a =>
    lastNewsViewedAt === null || new Date(a.published_at) > new Date(lastNewsViewedAt)
  )

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
        {VIEWS.map(({ key, label }) => {
          const isActive = currentView === key
          const showBadge = key === 'news-feed' && hasUnreadNews && !isActive
          return (
            <button
              key={key}
              data-testid={`view-btn-${key}`}
              onClick={() => setView(key)}
              style={{
                position: 'relative',
                background: 'transparent',
                border: `1px solid ${isActive ? 'var(--color-green)' : 'var(--border-subtle)'}`,
                color: isActive ? 'var(--color-green)' : 'var(--text-muted)',
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
              {showBadge && (
                <span
                  data-testid="news-unread-badge"
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--color-red)',
                    border: '1px solid var(--bg-primary)',
                    display: 'block',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Right side: operator info + memo archive */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          data-testid="open-memo-archive"
          onClick={() => useUIStore.getState().openModal('memo_archive')}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            padding: '2px 8px',
            borderRadius: 2,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          MEMOS
        </button>
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
    </div>
  )
}
