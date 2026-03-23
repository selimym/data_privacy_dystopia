/**
 * ShiftMemoOverlay — shown automatically between weeks when quota is met,
 * and at the start of new shifts as a briefing.
 * Acknowledging triggers the actual week advance (end-of-shift)
 * or just dismisses (briefing, where advance was already done).
 */
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export function ShiftMemoOverlay() {
  const memo = useUIStore(s => s.pendingShiftMemo)
  const dismissShiftMemo = useUIStore(s => s.dismissShiftMemo)

  if (!memo) return null

  const isBriefing = memo.isBriefing === true
  const accentColor =
    memo.tone === 'briefing' ? 'var(--text-primary)'
    : memo.tone === 'positive' ? 'var(--color-green)'
    : 'var(--color-amber)'

  function handleAcknowledge() {
    if (!memo) return
    if (!isBriefing) {
      useGameStore.getState().advanceDirective(memo.nextDirective)
    }
    dismissShiftMemo()
  }

  const headerLeft = memo.sender
    ? `${memo.sender.name.toUpperCase()} · ${memo.sender.title.toUpperCase()}`
    : isBriefing
      ? 'DIRECTIVE BRIEFING'
      : 'CIVIC HARMONY OS · SHIFT REPORT'

  const headerRight = isBriefing
    ? `CYCLE ${memo.weekNumber}`
    : `WEEK ${memo.weekNumber} COMPLETE`

  const subheading = isBriefing
    ? `DIRECTIVE BRIEFING — CYCLE ${memo.weekNumber}`
    : `OPERATOR PERFORMANCE SUMMARY · DIRECTIVE CYCLE ${memo.weekNumber}`

  const btnLabel = isBriefing
    ? 'ACKNOWLEDGE & BEGIN SHIFT →'
    : 'ACKNOWLEDGE & BEGIN NEXT SHIFT →'

  return (
    <div
      data-testid="shift-memo-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#060810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: '24px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-secondary)',
          border: `1px solid ${accentColor}`,
          borderRadius: 4,
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-primary)',
            borderBottom: `1px solid ${accentColor}`,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: accentColor,
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.2em' }}>
            {headerLeft}
          </span>
          <span style={{ marginLeft: 'auto', color: accentColor, fontSize: 9, letterSpacing: '0.12em' }}>
            {headerRight}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', minHeight: 140 }}>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 9,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}
          >
            {subheading}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-line',
            }}
          >
            {memo.memoText}
          </div>
          {memo.recruitmentLink && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <a
                href={memo.recruitmentLink.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: 'var(--color-blue)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--color-blue)',
                  paddingBottom: 1,
                }}
              >
                {memo.recruitmentLink.label} ↗
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid var(--border-subtle)`,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            data-testid="shift-memo-acknowledge-btn"
            onClick={handleAcknowledge}
            style={{
              background: 'transparent',
              border: `1px solid ${accentColor}`,
              color: accentColor,
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              padding: '6px 16px',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
