/**
 * MemoScreen — shown once before the dashboard on a player's very first shift.
 * Uses StreamingText to deliver the system memo in robotic AI style.
 * On acknowledge: marks memo as read (localStorage) and starts tutorial.
 */
import { useRef, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { StreamingText } from '@/components/shared'
import type { StreamingTextHandle, TextSegment } from '@/components/shared'

const MEMO_SEGMENTS: TextSegment[] = [
  { text: 'Operator SYS-OP-001.', style: { color: 'var(--text-primary)' } },
  { text: ' You have been assigned to the ' },
  { text: 'Public Safety Review Unit', style: { color: 'var(--text-primary)' } },
  { text: '.\n\n' },
  { text: 'Your task: review citizen files and flag individuals assessed as high-risk based on each week\'s directive. ' },
  { text: 'You are responsible for every decision you make.', style: { color: 'var(--color-amber)' } },
  { text: '\n\nYour first directive is already loaded. A short onboarding sequence will guide you through the interface when you begin.\n\n' },
  { text: 'Welcome to the team.' },
]

export default function MemoScreen() {
  const acknowledgeMemo = useUIStore(s => s.acknowledgeMemo)
  const [complete, setComplete] = useState(false)
  const streamRef = useRef<StreamingTextHandle>(null)

  function handleSkip() {
    streamRef.current?.skip()
  }

  function handleAcknowledge() {
    acknowledgeMemo()
  }

  return (
    <div
      data-testid="memo-screen"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#060810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
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
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-green)',
              display: 'inline-block',
              animation: 'streaming-cursor-blink 1s infinite',
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.2em' }}>
            CIVIC HARMONY OS · SECURE CHANNEL
          </span>
          <span style={{ marginLeft: 'auto', color: complete ? 'var(--text-placeholder)' : 'var(--color-green)', fontSize: 9 }}>
            {complete ? 'TRANSMISSION COMPLETE' : 'TRANSMITTING...'}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', minHeight: 200 }}>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 9,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}
          >
            OPERATOR INITIALIZATION · {new Date().toISOString().split('T')[0]} · REF: CHv2/OP/001
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text-muted)' }}>
            <StreamingText
              ref={streamRef}
              segments={MEMO_SEGMENTS}
              speed={22}
              onComplete={() => setComplete(true)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-placeholder)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              cursor: 'pointer',
            }}
          >
            SKIP
          </button>
          <button
            data-testid="memo-acknowledge-btn"
            onClick={handleAcknowledge}
            disabled={!complete}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-green)',
              color: 'var(--color-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              padding: '6px 16px',
              borderRadius: 2,
              cursor: complete ? 'pointer' : 'default',
              opacity: complete ? 1 : 0,
              transition: 'opacity 0.4s',
              pointerEvents: complete ? 'auto' : 'none',
            }}
          >
            ACKNOWLEDGE &amp; BEGIN SHIFT →
          </button>
        </div>
      </div>
    </div>
  )
}
