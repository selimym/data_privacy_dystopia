import React from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { Button } from '@/components/shared'

export default function AutoFlagBanner() {
  const { t } = useTranslation()
  const autoFlagState = useGameStore((s) => s.autoFlagState)
  const pendingBotDecisions = useGameStore((s) => s.pendingBotDecisions)

  const [dismissed, setDismissed] = React.useState(false)

  if (!autoFlagState.is_available) return null

  const pendingCount = pendingBotDecisions.length

  const handleEnable = () => {
    useGameStore.getState().setAutoFlagEnabled(true)
    useGameStore.getState().runBotRound()
  }

  const handleDisable = () => {
    useGameStore.getState().setAutoFlagEnabled(false)
  }

  const handleProcessBatch = () => {
    useGameStore.getState().processAutoFlagBatch()
  }

  // When autoflag is enabled, show a smaller persistent bar
  if (autoFlagState.is_enabled) {
    return (
      <div
        data-testid="autoflag-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '5px 16px',
          background: 'rgba(37, 99, 235, 0.1)',
          borderBottom: '1px solid rgba(37, 99, 235, 0.3)',
        }}
      >
        <span
          data-testid="autoflag-status"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-blue)',
            letterSpacing: '0.1em',
          }}
        >
          ⚡ {t('autoflag.status.enabled')}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          — {t('autoflag.banner.queue', { count: pendingCount })}
        </span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <Button size="sm" variant="secondary" onClick={handleProcessBatch}>
            PROCESS BATCH
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDisable}>
            DISABLE
          </Button>
        </div>
      </div>
    )
  }

  // Dismissed for this session
  if (dismissed) return null

  // Full banner — autoflag available but not yet enabled
  const accuracyPct = Math.round(autoFlagState.bot_accuracy * 1000) / 10

  return (
    <div
      data-testid="autoflag-banner"
      style={{
        padding: '10px 16px',
        background: 'rgba(37, 99, 235, 0.1)',
        borderBottom: '1px solid rgba(37, 99, 235, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-blue)',
            letterSpacing: '0.12em',
          }}
        >
          ⚡ {t('autoflag.banner.title')}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}
        >
          — {t('autoflag.banner.subtitle')}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          {t('autoflag.banner.accuracy', { accuracy: accuracyPct })}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          {t('autoflag.banner.queue', { count: pendingCount })}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          Est. completion: 4 min
        </span>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <Button
            size="sm"
            variant="primary"
            onClick={handleEnable}
            data-testid="enable-autoflag-btn"
          >
            {t('autoflag.banner.enable')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            {t('autoflag.banner.review')}
          </Button>
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}
      >
        Note: {t('autoflag.banner.warning')}
      </div>
    </div>
  )
}
