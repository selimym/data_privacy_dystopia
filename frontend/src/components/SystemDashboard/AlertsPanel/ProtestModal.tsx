import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import type { ProtestEvent, SuppressionResult } from '@/types/game'

interface ProtestAlertProps {
  protest: ProtestEvent
}

function ProtestAlert({ protest }: ProtestAlertProps) {
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

  return (
    <div
      data-testid={`protest-alert-${protest.id}`}
      style={{
        marginBottom: 8,
        padding: '10px 10px 8px',
        background: 'rgba(217, 119, 6, 0.08)',
        border: '1px solid rgba(217, 119, 6, 0.4)',
        borderRadius: 2,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-amber)',
          letterSpacing: '0.1em',
          marginBottom: 6,
        }}
      >
        ⚠ {t('protest.modal.title')}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        <span style={{ fontWeight: 600 }}>{protest.size.toLocaleString()}</span>
        {' '}{t('protest.modal.size').toLowerCase()} — {protest.neighborhood}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          data-testid={`protest-declare-illegal-${protest.id}`}
          onClick={handleDeclareIllegal}
          style={{
            flex: 1,
            padding: '5px 8px',
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid var(--color-amber)',
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {t('protest.modal.action.illegal')}
        </button>
        <button
          data-testid={`protest-force-${protest.id}`}
          onClick={handleForce}
          style={{
            flex: 1,
            padding: '5px 8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-red)',
            color: 'var(--color-red)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {t('protest.modal.action.incite')}
        </button>
      </div>
    </div>
  )
}

export function ProtestModal() {
  const activeProtests = useGameStore(s => s.activeProtests)
  const unacknowledged = activeProtests.filter(p => !p.acknowledged)

  if (unacknowledged.length === 0) return null

  return (
    <div data-testid="protest-modal-list">
      {unacknowledged.map(protest => (
        <ProtestAlert key={protest.id} protest={protest} />
      ))}
    </div>
  )
}
