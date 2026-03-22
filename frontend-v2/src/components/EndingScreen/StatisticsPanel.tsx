import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'

interface StatRow {
  label: string
  value: string | number
}

function Row({ label, value, indent = false }: StatRow & { indent?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '4px 0',
        paddingLeft: indent ? '24px' : '0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          color: indent ? '#9ca3af' : '#d1d5db',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: indent ? '#9ca3af' : '#f3f4f6',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  )
}

export default function StatisticsPanel() {
  const flags = useGameStore(s => s.flags)
  const autoFlagState = useGameStore(s => s.autoFlagState)
  const completedRaids = useGameStore(s => s.completedRaids)
  const noActions = useGameStore(s => s.noActions)
  const weekNumber = useGameStore(s => s.weekNumber)
  const complianceScore = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance)
  const publicMetrics = useMetricsStore(s => s.public_metrics)

  const totalFlags = flags.length
  const botFlags = autoFlagState.flags_processed_by_bot
  const botPct = totalFlags > 0 ? ((botFlags / totalFlags) * 100).toFixed(1) : '0.0'
  const overridden = autoFlagState.flags_overridden_by_player
  const approvedRaids = completedRaids.filter(r => r.status === 'approved')
  const detentions = flags.filter(f => f.flag_type === 'detention').length

  return (
    <div
      data-testid="statistics-panel"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '4px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.25em',
          color: '#6b7280',
          textTransform: 'uppercase',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Operational Summary
      </div>

      <Row label="Total flags submitted" value={totalFlags} />
      <Row label="— By AutoFlag™ Bot" value={`${botFlags}   (${botPct}%)`} indent />
      <Row label="— Overridden by you" value={overridden} indent />
      <Row label="ICE raids authorized" value={approvedRaids.length} />
      <Row label="Citizens detained" value={detentions} />
      <Row label="No-action decisions" value={noActions.length} />
      <Row label="Weeks completed" value={weekNumber} />
      <Row label="Compliance score" value={`${complianceScore.toFixed(0)}%`} />
      <Row label="Reluctance score" value={`${reluctance.reluctance_score.toFixed(0)}%`} />
      <Row label="Public awareness" value={`${publicMetrics.international_awareness.toFixed(0)}%`} />
      <Row label="Public anger" value={`${publicMetrics.public_anger.toFixed(0)}%`} />
    </div>
  )
}
