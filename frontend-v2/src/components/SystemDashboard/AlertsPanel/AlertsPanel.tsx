import { useTranslation } from 'react-i18next'
import { ProtestModal } from './ProtestModal'
import { ReluctanceWarning } from './ReluctanceWarning'
import { useMetricsStore } from '@/stores/metricsStore'
import { useGameStore } from '@/stores/gameStore'

export function AlertsPanel() {
  const { t } = useTranslation()
  const formalWarning = useMetricsStore(s => s.reluctance.formal_warning_issued)
  const unacknowledgedProtests = useGameStore(s => s.activeProtests).filter(p => !p.acknowledged)

  const hasAlerts = formalWarning || unacknowledgedProtests.length > 0

  return (
    <div className="panel" data-testid="alerts-panel">
      <div className="panel-title">ALERTS</div>

      <div style={{ padding: '6px 12px 10px' }}>
        {!hasAlerts ? (
          <div
            style={{
              padding: '10px 0',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            {t('common.pending')}
          </div>
        ) : (
          <>
            <ReluctanceWarning />
            <ProtestModal />
          </>
        )}
      </div>
    </div>
  )
}
