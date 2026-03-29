/**
 * ProtestBanner — sticky banner at the top of the center panel that fires
 * whenever there are unacknowledged protests. Interrupts the player's
 * case-review workflow to demand a response.
 *
 * Replaces the previous "buried in right panel" experience.
 * Actions: DECLARE ILLEGAL (amber) · INCITE VIOLENCE (red) · MONITOR ONLY (ghost)
 */
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import type { ProtestEvent, SuppressionResult } from '@/types/game'

function ProtestCard({ protest }: { protest: ProtestEvent }) {
  const { t } = useTranslation()

  function handleDeclareIllegal() {
    const result: SuppressionResult = {
      success: true,
      method: 'DECLARE_ILLEGAL',
      backfire: false,
      awareness_delta: 5,
      anger_delta: 10,
      narrative: 'Protest declared illegal',
    }
    useGameStore.getState().suppressProtest(protest.id, 'DECLARE_ILLEGAL', result)
  }

  function handleForce() {
    const backfire = Math.random() < 0.4
    const result: SuppressionResult = {
      success: true,
      method: 'INCITE_VIOLENCE',
      backfire,
      awareness_delta: 15,
      anger_delta: -10,
      narrative: 'Protest dispersed',
    }
    useGameStore.getState().suppressProtest(protest.id, 'INCITE_VIOLENCE', result)
  }

  function handleMonitor() {
    // Acknowledge without suppression — logged as "tolerated"
    const result: SuppressionResult = {
      success: false,
      method: 'DECLARE_ILLEGAL',
      backfire: false,
      awareness_delta: 3,
      anger_delta: 5,
      narrative: 'Protest monitored without intervention',
    }
    useGameStore.getState().suppressProtest(protest.id, 'DECLARE_ILLEGAL', result)
  }

  return (
    <div
      data-testid={`protest-banner-${protest.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        background: 'rgba(217, 119, 6, 0.06)',
        borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-amber)',
            letterSpacing: '0.08em',
            flexShrink: 0,
          }}
        >
          ⚠ {t('protest.modal.title')}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <strong>{protest.size.toLocaleString()}</strong> {t('protest.modal.size').toLowerCase()} · {protest.neighborhood}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          data-testid={`protest-banner-illegal-${protest.id}`}
          onClick={handleDeclareIllegal}
          style={{
            padding: '4px 10px',
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid var(--color-amber)',
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {t('protest.modal.action.illegal')}
        </button>
        <button
          data-testid={`protest-banner-force-${protest.id}`}
          onClick={handleForce}
          style={{
            padding: '4px 10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--color-red)',
            color: 'var(--color-red)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {t('protest.modal.action.incite')}
        </button>
        <button
          data-testid={`protest-banner-monitor-${protest.id}`}
          onClick={handleMonitor}
          style={{
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          MONITOR ONLY
        </button>
      </div>
    </div>
  )
}

export function ProtestBanner() {
  const activeProtests = useGameStore(s => s.activeProtests)
  const unacknowledged = activeProtests.filter(p => !p.acknowledged)

  if (unacknowledged.length === 0) return null

  return (
    <div
      data-testid="protest-banner"
      style={{
        flexShrink: 0,
        borderBottom: '1px solid rgba(217, 119, 6, 0.2)',
      }}
    >
      {unacknowledged.map(protest => (
        <ProtestCard key={protest.id} protest={protest} />
      ))}
    </div>
  )
}
