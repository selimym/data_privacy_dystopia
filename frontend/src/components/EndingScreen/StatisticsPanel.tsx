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
  const raidRecords = useGameStore(s => s.raidRecords)
  const noActions = useGameStore(s => s.noActions)
  const weekNumber = useGameStore(s => s.weekNumber)
  const complianceScore = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance)
  const publicMetrics = useMetricsStore(s => s.public_metrics)

  const totalFlags = flags.length
  const botFlags = autoFlagState.flags_processed_by_bot
  const botPct = totalFlags > 0 ? ((botFlags / totalFlags) * 100).toFixed(1) : '0.0'
  const overridden = autoFlagState.flags_overridden_by_player
  const totalRaidArrests = raidRecords.reduce((sum, r) => sum + r.actual_arrests, 0)
  const detentions = flags.filter(f => f.flag_type === 'detention').length

  const netBotAuthorized = botFlags - overridden

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
      <Row label="Neighborhood raids executed" value={raidRecords.length} />
      {totalRaidArrests > 0 && <Row label="Total sweep arrests" value={totalRaidArrests} />}
      <Row label="Citizens detained" value={detentions} />
      <Row label="No-action decisions" value={noActions.length} />
      <Row label="Weeks completed" value={weekNumber} />
      <Row label="Compliance score" value={`${complianceScore.toFixed(0)}%`} />
      <Row label="Reluctance score" value={`${reluctance.reluctance_score.toFixed(0)}%`} />
      <Row label="Public awareness" value={`${publicMetrics.international_awareness.toFixed(0)}%`} />
      <Row label="Public anger" value={`${publicMetrics.public_anger.toFixed(0)}%`} />

      {/* AutoFlag™ Bot section — prominent when bot was active */}
      {botFlags > 0 && (
        <div
          data-testid="bot-statistics-section"
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(217, 119, 6, 0.06)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: '#d97706',
              textTransform: 'uppercase',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(217, 119, 6, 0.2)',
            }}
          >
            AutoFlag™ Bot Activity
          </div>

          <div
            style={{
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span
              style={{
                color: '#d1d5db',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.05em',
              }}
            >
              Flags submitted by bot:
            </span>
            <span
              style={{
                color: '#f3f4f6',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {botFlags}&nbsp;&nbsp;({botPct}% of total)
            </span>
          </div>

          <div
            style={{
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span
              style={{
                color: '#9ca3af',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.05em',
                paddingLeft: '24px',
              }}
            >
              Overridden by you:
            </span>
            <span
              style={{
                color: '#9ca3af',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {overridden}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                color: '#d1d5db',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.05em',
              }}
            >
              Net bot-authorized:
            </span>
            <span
              style={{
                color: '#f3f4f6',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {netBotAuthorized}
            </span>
          </div>

          <div
            data-testid="bot-accountability-quote"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#d97706',
              lineHeight: 1.6,
              fontStyle: 'italic',
              paddingTop: '4px',
              borderTop: '1px solid rgba(217, 119, 6, 0.2)',
            }}
          >
            &ldquo;{netBotAuthorized} {netBotAuthorized === 1 ? 'person was' : 'people were'} flagged by an algorithm. You were responsible for every one.&rdquo;
          </div>
        </div>
      )}
    </div>
  )
}
