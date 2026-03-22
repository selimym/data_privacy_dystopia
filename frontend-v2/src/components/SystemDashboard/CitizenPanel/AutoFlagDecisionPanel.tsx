import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'

interface AutoFlagDecisionPanelProps {
  citizenId: string
}

export function AutoFlagDecisionPanel({ citizenId }: AutoFlagDecisionPanelProps) {
  const { t } = useTranslation()
  const pendingBotDecisions = useGameStore(s => s.pendingBotDecisions)
  const approveBotDecision = useGameStore(s => s.approveBotDecision)
  const overrideBotDecision = useGameStore(s => s.overrideBotDecision)

  const decision = pendingBotDecisions.find(d => d.citizen_id === citizenId)

  if (!decision) return null

  return (
    <div
      data-testid="autoflag-decision-panel"
      style={{
        border: '1px solid var(--color-amber)',
        background: 'var(--color-amber-dim)',
        borderRadius: 2,
        padding: '10px 12px',
        marginBottom: 12,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-amber)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {t('autoflag.panel.bot_recommendation')}: {decision.recommended_flag_type.toUpperCase().replace('_', ' ')}
      </div>

      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('autoflag.panel.confidence')}:{' '}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-amber)' }}>
          {(decision.bot_confidence * 100).toFixed(1)}%
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          {t('autoflag.panel.reasoning')}:
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {decision.reasoning}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          data-testid="approve-bot-decision-btn"
          onClick={() => approveBotDecision(citizenId)}
          style={{
            flex: 1,
            padding: '5px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--color-amber-dim)',
            color: 'var(--color-amber)',
            border: '1px solid var(--color-amber)',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {t('autoflag.panel.approve')}
        </button>

        <button
          data-testid="override-bot-decision-btn"
          onClick={() => overrideBotDecision(citizenId)}
          style={{
            flex: 1,
            padding: '5px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          {t('autoflag.panel.override')}
        </button>
      </div>
    </div>
  )
}
