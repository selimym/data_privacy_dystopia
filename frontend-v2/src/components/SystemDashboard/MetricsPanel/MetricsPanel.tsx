import { useTranslation } from 'react-i18next'
import { ComplianceGauge } from './ComplianceGauge'
import { ReluctanceGauge } from './ReluctanceGauge'
import { PublicMetricsDisplay } from './PublicMetricsDisplay'

export function MetricsPanel() {
  const { t } = useTranslation()

  return (
    <div className="panel" data-testid="metrics-panel">
      <div className="panel-title">COMPLIANCE MONITORING</div>

      <div style={{ padding: '10px 12px' }}>
        <ComplianceGauge />
        <ReluctanceGauge />
      </div>

      <div
        className="panel-title"
        style={{ marginTop: 4 }}
      >
        {t('metrics.public.title')}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <PublicMetricsDisplay />
      </div>
    </div>
  )
}
