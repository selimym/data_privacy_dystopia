/**
 * DirectiveBanner — slim banner at the top of the center panel.
 * Shows the current week's directive title and quota progress.
 * The timer and full quota bar live in the right panel (DirectivePanel).
 */
import { useGameStore } from '@/stores/gameStore'

export function DirectiveBanner() {
  const directive = useGameStore(s => s.currentDirective)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)

  if (!directive) return null

  const completed = flags.filter(f => f.directive_key === directive.directive_key).length
  const pct = Math.min(100, Math.round((completed / directive.flag_quota) * 100))
  const met = completed >= directive.flag_quota

  return (
    <div
      style={{
        padding: '6px 14px',
        background: 'rgba(217, 119, 6, 0.05)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: 9,
          letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
        }}
      >
        DIRECTIVE WK {weekNumber}
      </span>
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: 11,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {directive.title}
      </span>
      {/* Inline quota progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 60,
            height: 4,
            background: 'var(--border-subtle)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: met ? 'var(--color-green)' : 'var(--color-amber)',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span
          style={{
            color: met ? 'var(--color-green)' : 'var(--color-amber)',
            fontSize: 9,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {completed}/{directive.flag_quota}
        </span>
      </div>
    </div>
  )
}
