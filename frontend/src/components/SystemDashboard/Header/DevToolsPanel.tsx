import { useState, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'
import type { EndingType } from '@/types/game'

const ALL_ENDING_TYPES: EndingType[] = [
  'compliant_operator',
  'reluctant_operator',
  'reluctant_survivor',
  'resistance_path',
  'mysterious_death',
  'revolutionary_catalyst',
  'international_pariah',
  'imprisoned_dissent',
  'fired_early',
  'suspended_operator',
]

interface DevToolsPanelProps {
  onClose: () => void
}

export default function DevToolsPanel({ onClose }: DevToolsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const weekNumber = useGameStore(s => s.weekNumber)
  const devSkipToWeek = useGameStore(s => s.devSkipToWeek)
  const devForceEnding = useGameStore(s => s.devForceEnding)
  const resistancePath = useGameStore(s => s.resistancePath)
  const activateResistancePath = useGameStore(s => s.activateResistancePath)

  const compliance = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance)
  const publicMetrics = useMetricsStore(s => s.public_metrics)
  const setComplianceScore = useMetricsStore(s => s.setComplianceScore)
  const setReluctance = useMetricsStore(s => s.setReluctance)
  const setPublicMetrics = useMetricsStore(s => s.setPublicMetrics)

  const [weekInput, setWeekInput] = useState(String(weekNumber))
  const [complianceInput, setComplianceInput] = useState(String(compliance))
  const [reluctanceInput, setReluctanceInput] = useState(String(reluctance.reluctance_score))
  const [angerInput, setAngerInput] = useState(String(publicMetrics.public_anger))
  const [awarenessInput, setAwarenessInput] = useState(String(publicMetrics.international_awareness))
  const [endingInput, setEndingInput] = useState<EndingType | ''>('')

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const handleWeekSkip = () => {
    const n = parseInt(weekInput, 10)
    if (isNaN(n) || n < 1 || n > 6) return
    devSkipToWeek(n)
  }

  const handleComplianceSet = () => {
    const n = parseInt(complianceInput, 10)
    if (isNaN(n)) return
    setComplianceScore(clamp(n, 0, 100))
  }

  const handleReluctanceSet = () => {
    const n = parseInt(reluctanceInput, 10)
    if (isNaN(n)) return
    setReluctance({ ...reluctance, reluctance_score: clamp(n, 0, 100) })
  }

  const handlePublicMetricsSet = () => {
    const anger = parseInt(angerInput, 10)
    const awareness = parseInt(awarenessInput, 10)
    if (isNaN(anger) || isNaN(awareness)) return
    setPublicMetrics({
      ...publicMetrics,
      public_anger: clamp(anger, 0, 100),
      international_awareness: clamp(awareness, 0, 100),
    })
  }

  const handleForceEnding = () => {
    if (!endingInput) return
    devForceEnding(endingInput)
  }

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #374151',
    color: '#e5e7eb',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    padding: '3px 6px',
    width: 64,
    borderRadius: 2,
  }

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#9ca3af',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.1em',
    padding: '3px 10px',
    cursor: 'pointer',
    borderRadius: 2,
    whiteSpace: 'nowrap' as const,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: '#6b7280',
    letterSpacing: '0.08em',
    minWidth: 130,
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.6)',
        }}
      />
      <div
        ref={panelRef}
        data-testid="dev-panel"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: '#0d0d0f',
          border: '2px solid #dc2626',
          borderRadius: 3,
          padding: 16,
          minWidth: 360,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 48px rgba(220,38,38,0.2), 0 8px 32px rgba(0,0,0,0.9)',
        }}
      >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: '#dc2626',
            textTransform: 'uppercase',
          }}
        >
          ⚠ DEV TOOLS — NOT FOR PLAYERS
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
        >
          ×
        </button>
      </div>

      <div style={{ height: 1, background: '#1f2937', marginBottom: 12 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Current week */}
        <div style={rowStyle}>
          <span style={labelStyle}>Current week</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e5e7eb' }}>
            {weekNumber}
          </span>
        </div>

        {/* Skip to week */}
        <div style={rowStyle}>
          <span style={labelStyle}>Skip to week (1–6)</span>
          <input
            data-testid="dev-week-input"
            type="number"
            min={1}
            max={6}
            value={weekInput}
            onChange={e => setWeekInput(e.target.value)}
            style={inputStyle}
          />
          <button
            data-testid="dev-week-skip"
            onClick={handleWeekSkip}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            SKIP →
          </button>
        </div>

        <div style={{ height: 1, background: '#1f2937' }} />

        {/* Compliance */}
        <div style={rowStyle}>
          <span style={labelStyle}>Compliance (0–100)</span>
          <input
            data-testid="dev-compliance-input"
            type="number"
            min={0}
            max={100}
            value={complianceInput}
            onChange={e => setComplianceInput(e.target.value)}
            style={inputStyle}
          />
          <button
            data-testid="dev-compliance-set"
            onClick={handleComplianceSet}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            SET
          </button>
        </div>

        {/* Reluctance */}
        <div style={rowStyle}>
          <span style={labelStyle}>Reluctance (0–100)</span>
          <input
            data-testid="dev-reluctance-input"
            type="number"
            min={0}
            max={100}
            value={reluctanceInput}
            onChange={e => setReluctanceInput(e.target.value)}
            style={inputStyle}
          />
          <button
            data-testid="dev-reluctance-set"
            onClick={handleReluctanceSet}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            SET
          </button>
        </div>

        <div style={{ height: 1, background: '#1f2937' }} />

        {/* Public metrics */}
        <div style={rowStyle}>
          <span style={labelStyle}>Public Anger (0–100)</span>
          <input
            data-testid="dev-anger-input"
            type="number"
            min={0}
            max={100}
            value={angerInput}
            onChange={e => setAngerInput(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Int. Awareness (0–100)</span>
          <input
            data-testid="dev-awareness-input"
            type="number"
            min={0}
            max={100}
            value={awarenessInput}
            onChange={e => setAwarenessInput(e.target.value)}
            style={inputStyle}
          />
          <button
            data-testid="dev-public-metrics-set"
            onClick={handlePublicMetricsSet}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            SET
          </button>
        </div>

        <div style={{ height: 1, background: '#1f2937' }} />

        {/* Force ending */}
        <div style={rowStyle}>
          <span style={labelStyle}>Force Ending</span>
          <select
            data-testid="dev-ending-select"
            value={endingInput}
            onChange={e => setEndingInput(e.target.value as EndingType | '')}
            style={{
              ...inputStyle,
              width: 'auto',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            <option value="">-- select --</option>
            {ALL_ENDING_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            data-testid="dev-ending-trigger"
            onClick={handleForceEnding}
            disabled={!endingInput}
            style={{
              ...btnStyle,
              opacity: endingInput ? 1 : 0.4,
              cursor: endingInput ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (endingInput) (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af' }}
          >
            TRIGGER
          </button>
        </div>

        <div style={{ height: 1, background: '#1f2937' }} />

        {/* Resistance path */}
        <div style={rowStyle}>
          <button
            data-testid="dev-resistance-toggle"
            onClick={activateResistancePath}
            disabled={resistancePath}
            style={{
              ...btnStyle,
              width: '100%',
              opacity: resistancePath ? 0.4 : 1,
              cursor: resistancePath ? 'not-allowed' : 'pointer',
              color: resistancePath ? '#22c55e' : '#9ca3af',
              borderColor: resistancePath ? '#22c55e55' : 'rgba(255,255,255,0.18)',
            }}
          >
            {resistancePath ? '✓ RESISTANCE PATH ACTIVE' : 'ACTIVATE RESISTANCE PATH'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
