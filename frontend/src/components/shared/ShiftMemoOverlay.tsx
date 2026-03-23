/**
 * ShiftMemoOverlay — shown automatically between weeks when quota is met.
 * Delivers a short shift-report memo from the system, with tone reflecting
 * the operator's compliance/reluctance metrics.
 * Acknowledging this memo triggers the actual week advance.
 */
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export function ShiftMemoOverlay() {
  const memo = useUIStore(s => s.pendingShiftMemo)
  const dismissShiftMemo = useUIStore(s => s.dismissShiftMemo)

  if (!memo) return null

  const accentColor = memo.tone === 'positive' ? 'var(--color-green)' : 'var(--color-amber)'

  function handleAcknowledge() {
    if (!memo) return
    useGameStore.getState().advanceDirective(memo.nextDirective)
    dismissShiftMemo()
  }

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
            CIVIC HARMONY OS · SHIFT REPORT
          </span>
          <span style={{ marginLeft: 'auto', color: accentColor, fontSize: 9, letterSpacing: '0.12em' }}>
            WEEK {memo.weekNumber} COMPLETE
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
            OPERATOR PERFORMANCE SUMMARY · DIRECTIVE CYCLE {memo.weekNumber}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
            }}
          >
            {memo.memoText}
          </div>
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
            ACKNOWLEDGE &amp; BEGIN NEXT SHIFT →
          </button>
        </div>
      </div>
    </div>
  )
}
