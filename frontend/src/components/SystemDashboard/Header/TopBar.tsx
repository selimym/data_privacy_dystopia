/**
 * TopBar — view switcher (CASE REVIEW | NEWS FEED | WORLD MAP) + operator info.
 * Replaces the old DashboardHeader as the primary navigation bar.
 */
import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import type { DashboardView } from '@/stores/uiStore'

function ShiftTimer() {
  const shiftStartTime = useUIStore(s => s.shiftStartTime)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!shiftStartTime) return
    const update = () => setElapsed(Math.floor((Date.now() - shiftStartTime) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [shiftStartTime])

  if (!shiftStartTime) return null

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const display = `${m}:${String(s).padStart(2, '0')}`
  const isLong = elapsed > 1800 // >30 min — amber warning

  return (
    <span
      title="Shift elapsed time"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        color: isLong ? 'var(--color-amber)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
        padding: '2px 8px',
        border: `1px solid ${isLong ? 'var(--color-amber)' : 'var(--border-subtle)'}`,
        borderRadius: 2,
      }}
    >
      ⏱ {display}
    </span>
  )
}

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
          fontSize: 12,
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
                fontSize: 12,
                letterSpacing: '0.12em',
                padding: '4px 12px',
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

      {/* Right side: shift timer + operator info + memo archive */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShiftTimer />
        <button
          data-testid="open-memo-archive"
          onClick={() => useUIStore.getState().openModal('memo_archive')}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            padding: '3px 9px',
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
            fontSize: 11,
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
