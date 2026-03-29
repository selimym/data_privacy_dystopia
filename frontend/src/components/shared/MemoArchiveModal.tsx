/**
 * MemoArchiveModal — scrollable list of all shift memos received this run.
 * Opened via the MEMOS button in TopBar.
 * Allows players to re-read colleague messages and narrative context.
 */
import { useUIStore } from '@/stores/uiStore'
import type { ShiftMemoData } from '@/types/ui'

function MemoEntry({ memo }: { memo: ShiftMemoData }) {
  const isBriefing = memo.isBriefing === true
  const isSpecial = memo.isHacktivistContact || memo.isEpsteinOrder

  const accentColor =
    memo.tone === 'briefing' ? 'var(--text-muted)'
    : memo.tone === 'positive' ? 'var(--color-green)'
    : 'var(--color-amber)'

  const headerLabel = memo.sender
    ? `${memo.sender.name.toUpperCase()} · ${memo.sender.title.toUpperCase()}`
    : isBriefing
      ? 'DIRECTIVE BRIEFING'
      : 'CIVIC HARMONY OS · SHIFT REPORT'

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 16,
        marginBottom: 16,
      }}
    >
      {/* Entry header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: accentColor,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
            }}
          >
            {headerLabel}
          </span>
          {isSpecial && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-red)',
                letterSpacing: '0.1em',
                border: '1px solid var(--color-red)',
                padding: '1px 4px',
                borderRadius: 2,
              }}
            >
              CLASSIFIED
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: accentColor,
            letterSpacing: '0.1em',
          }}
        >
          CYCLE {memo.weekNumber}
        </span>
      </div>

      {/* Memo body */}
      <div
        style={{
          paddingLeft: 13,
          borderLeft: `2px solid ${accentColor}`,
          opacity: 0.9,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
            fontFamily: memo.sender ? 'var(--font-mono)' : 'var(--font-ui)',
          }}
        >
          {memo.memoText}
        </div>
        {memo.recruitmentLink && (
          <div style={{ marginTop: 8 }}>
            <a
              href={memo.recruitmentLink.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-blue)',
                textDecoration: 'none',
                letterSpacing: '0.1em',
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

      {/* Inline briefing preview if it was included */}
      {!isBriefing && memo.nextDirectiveBriefing && (
        <div
          style={{
            marginTop: 10,
            paddingLeft: 13,
            borderLeft: '2px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            ▶ NEXT DIRECTIVE — CYCLE {memo.weekNumber + 1}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {memo.nextDirectiveBriefing.title} · {memo.nextDirectiveBriefing.quota} {memo.nextDirectiveBriefing.flagType} required
          </div>
        </div>
      )}
    </div>
  )
}

export function MemoArchiveModal() {
  const memoHistory = useUIStore(s => s.memoHistory)
  const closeModal = useUIStore(s => s.closeModal)
  const modal = useUIStore(s => s.modal)

  if (modal.type !== 'memo_archive') return null

  const sorted = [...memoHistory].reverse() // newest first

  return (
    <div
      data-testid="memo-archive-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.15em' }}>
            OPERATOR MEMO ARCHIVE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.08em' }}>
              {sorted.length} {sorted.length === 1 ? 'RECORD' : 'RECORDS'}
            </span>
            <button
              data-testid="memo-archive-close"
              onClick={closeModal}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '2px 8px',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {sorted.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 11,
                letterSpacing: '0.08em',
                padding: '24px 0',
              }}
            >
              NO MEMOS ON RECORD
            </div>
          ) : (
            sorted.map((memo, i) => (
              <MemoEntry key={i} memo={memo} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
