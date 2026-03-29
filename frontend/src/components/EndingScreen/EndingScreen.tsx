import { useEffect, useMemo } from 'react'
import type { EndingResult } from '@/services/EndingCalculator'
import { useUIStore } from '@/stores/uiStore'
import { markEndingSeen } from '@/services/EndingsArchive'
import NarrativeDisplay from './NarrativeDisplay'
import StatisticsPanel from './StatisticsPanel'
import RealWorldParallels from './RealWorldParallels'
import EducationalLinks from './EducationalLinks'

// Ending type → display color
const ENDING_TITLE_COLORS: Record<string, string> = {
  compliant_operator: '#ef4444',
  state_servant: '#ef4444',
  reluctant_operator: '#f59e0b',
  refusal_burnout: '#f59e0b',
  resistance_hero: '#22c55e',
  resistance_path: '#22c55e',
  whistleblower: '#3b82f6',
  early_termination: '#3b82f6',
  suspended_operator: '#f59e0b',
  fired_early: '#f59e0b',
  imprisoned_dissent: '#ef4444',
  international_pariah: '#ef4444',
  revolutionary_catalyst: '#f97316',
  reluctant_survivor: '#f59e0b',
}

function getEndingTitleColor(endingType: string): string {
  return ENDING_TITLE_COLORS[endingType] ?? '#6b7280'
}

function readEndingResult(): EndingResult | null {
  const raw = (window as unknown as Record<string, unknown>).__endingResult
  if (raw == null) return null
  return raw as EndingResult
}

export default function EndingScreen() {
  const setScreen = useUIStore(s => s.setScreen)
  const endingResult = useMemo(() => readEndingResult(), [])

  useEffect(() => {
    if (endingResult?.ending_type) {
      markEndingSeen(endingResult.ending_type)
    }
  }, [endingResult])

  const titleColor = endingResult
    ? getEndingTitleColor(endingResult.ending_type)
    : '#6b7280'

  return (
    <div
      data-testid="ending-screen"
      style={{
        height: '100vh',
        background: '#0d0d0f',
        color: '#e5e7eb',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      {/* ── Compact header ─────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 32px 16px',
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          — Operator Assessment Complete —
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: titleColor,
            margin: 0,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          {endingResult ? endingResult.title : 'Game Over'}
        </h1>
        {endingResult && (
          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color: '#9ca3af',
              letterSpacing: '0.05em',
            }}
          >
            {endingResult.operator_final_status}
          </div>
        )}
      </div>

      {/* ── Two-column body ─────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left: Narrative */}
        <div
          style={{
            overflowY: 'auto',
            padding: '24px 28px',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {endingResult ? (
            <NarrativeDisplay
              narrative={endingResult.narrative}
              ending_key={endingResult.ending_type}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '13px',
                padding: '64px 0',
              }}
            >
              No ending data available.
            </div>
          )}

          {endingResult && (
            <RealWorldParallels parallel={endingResult.real_world_parallel} />
          )}
        </div>

        {/* Right: Stats + links + actions */}
        <div
          style={{
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <StatisticsPanel />

          <EducationalLinks />

          {/* Action buttons */}
          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              data-testid="view-archive-btn"
              onClick={() => setScreen('endings_archive')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#e5e7eb',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.6)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              ◆ Endings Archive
            </button>
            <button
              data-testid="play-again-btn"
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#9ca3af',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.4)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
