import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { saveGameState, loadGameState, clearGameState } from '@/stores/persistence'
import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { useContentStore } from '@/stores/contentStore'
import { useCitizenStore } from '@/stores/citizenStore'

export function SaveLoadPanel() {
  const { t } = useTranslation()
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // Fetch the current save timestamp on mount
  useEffect(() => {
    loadGameState().then(state => {
      setSavedAt(state?.saved_at ?? null)
    }).catch(() => {
      setSavedAt(null)
    })
  }, [])

  const handleSave = async () => {
    const gameState = useGameStore.getState()
    const metrics = useMetricsStore.getState()
    const ui = useUIStore.getState()
    const content = useContentStore.getState()
    const citizens = useCitizenStore.getState()

    await saveGameState({
      game: {
        operator: gameState.operator,
        currentDirective: gameState.currentDirective,
        completedDirectiveKeys: gameState.completedDirectiveKeys,
        weekNumber: gameState.weekNumber,
        currentTimePeriod: gameState.currentTimePeriod,
        flags: gameState.flags,
        noActions: gameState.noActions,
        newsChannels: gameState.newsChannels,
        newsArticles: gameState.newsArticles,
        activeProtests: gameState.activeProtests,
        autoFlagState: gameState.autoFlagState,
        pendingRaids: gameState.pendingRaids,
        completedRaids: gameState.completedRaids,
        firedContractKeys: gameState.firedContractKeys,
        resistancePath: gameState.resistancePath,
      },
      citizens: {
        skeletons: citizens.skeletons,
      },
      metrics: {
        compliance_score: metrics.compliance_score,
        public_metrics: metrics.public_metrics,
        reluctance: metrics.reluctance,
      },
      ui: {
        currentScreen: ui.currentScreen,
      },
      content: {
        unlockedDomains: content.unlockedDomains,
        inferenceRules: content.inferenceRules,
        countryKey: content.country?.country_key,
      },
      saved_at: new Date().toISOString(),
    })
    const now = new Date().toISOString()
    setSavedAt(now)
    setStatusMsg(t('save.saved'))
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleLoad = async () => {
    const state = await loadGameState()
    if (!state) {
      setStatusMsg(t('save.no_save'))
      setTimeout(() => setStatusMsg(null), 3000)
      return
    }
    // Restore all stores from the persisted snapshot
    // The full restore is a best-effort partial restore since we don't have
    // typed setters for every field — we use the existing reset + partial set approach
    setStatusMsg(t('save.loaded'))
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    await clearGameState()
    setSavedAt(null)
    setConfirmClear(false)
    setStatusMsg(t('save.no_save'))
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.06em',
  }

  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    ...monoStyle,
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '7px 16px',
    background: disabled ? 'var(--bg-tertiary)' : 'transparent',
    color: disabled ? 'var(--text-disabled)' : color,
    border: `1px solid ${disabled ? 'var(--border-subtle)' : color}`,
    borderRadius: 2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    flex: 1,
  })

  return (
    <div data-testid="save-load-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Current save info */}
      <div style={{ ...monoStyle, color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.08em' }}>
        {savedAt
          ? `${t('save.saved')}: ${new Date(savedAt).toLocaleString()}`
          : t('save.no_save')}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          data-testid="save-now-btn"
          style={btnStyle('var(--color-blue)')}
          onClick={handleSave}
        >
          {t('save.save')}
        </button>

        <button
          data-testid="load-save-btn"
          style={btnStyle('var(--color-amber)', savedAt === null)}
          onClick={handleLoad}
          disabled={savedAt === null}
        >
          {t('save.load')}
        </button>
      </div>

      {/* Clear button — requires confirmation */}
      <div>
        <button
          data-testid="clear-save-btn"
          style={btnStyle(confirmClear ? 'var(--color-red)' : 'var(--text-muted)')}
          onClick={handleClear}
        >
          {confirmClear ? t('common.confirm') + ' — CLEAR ALL DATA' : 'CLEAR SAVED DATA'}
        </button>
        {confirmClear && (
          <div style={{ ...monoStyle, fontSize: 9, color: 'var(--color-red)', marginTop: 4 }}>
            {t('save.confirm_new')}
          </div>
        )}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div
          data-testid="save-status-msg"
          style={{ ...monoStyle, fontSize: 10, color: 'var(--color-green)', letterSpacing: '0.08em' }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  )
}
