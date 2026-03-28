import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMetricsStore } from '@/stores/metricsStore'
import { ComplianceGauge } from './ComplianceGauge'
import { ReluctanceGauge } from './ReluctanceGauge'
import { PublicMetricsDisplay } from './PublicMetricsDisplay'
import { OperatorProfilePanel } from '@/components/shared/OperatorProfilePanel'

const STORAGE_KEY_GAUGES = 'metrics_panel_gauges_expanded'
const STORAGE_KEY_PUBLIC = 'metrics_panel_public_expanded'

function readStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

export function MetricsPanel() {
  const { t } = useTranslation()
  const compliance = useMetricsStore(s => s.compliance_score)
  const reluctanceScore = useMetricsStore(s => s.reluctance.reluctance_score)

  const [gaugesExpanded, setGaugesExpanded] = useState(() => readStorage(STORAGE_KEY_GAUGES))
  const [publicExpanded, setPublicExpanded] = useState(() => readStorage(STORAGE_KEY_PUBLIC))

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_GAUGES, String(gaugesExpanded)) } catch {}
  }, [gaugesExpanded])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_PUBLIC, String(publicExpanded)) } catch {}
  }, [publicExpanded])

  const toggleStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-muted)',
    lineHeight: 1,
  }

  return (
    <div className="panel" data-testid="metrics-panel">
      {/* Compliance monitoring section */}
      <button
        className="panel-title"
        onClick={() => setGaugesExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ flex: 1 }}>COMPLIANCE MONITORING</span>
        {!gaugesExpanded && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginRight: 8, letterSpacing: '0.05em' }}>
            {compliance} / {reluctanceScore}
          </span>
        )}
        <span style={toggleStyle}>{gaugesExpanded ? '−' : '+'}</span>
      </button>

      {gaugesExpanded && (
        <div style={{ padding: '10px 12px' }}>
          <ComplianceGauge />
          <ReluctanceGauge />
          <OperatorProfilePanel />
        </div>
      )}

      {/* Public metrics section */}
      <button
        className="panel-title"
        onClick={() => setPublicExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border-subtle)',
          marginTop: publicExpanded ? 4 : 0,
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ flex: 1 }}>{t('metrics.public.title')}</span>
        <span style={toggleStyle}>{publicExpanded ? '−' : '+'}</span>
      </button>

      {publicExpanded && (
        <div style={{ padding: '10px 12px' }}>
          <PublicMetricsDisplay />
        </div>
      )}
    </div>
  )
}
