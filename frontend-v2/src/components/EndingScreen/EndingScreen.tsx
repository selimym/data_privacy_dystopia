import { useMemo } from 'react'
import type { EndingResult } from '@/services/EndingCalculator'
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
  const endingResult = useMemo(() => readEndingResult(), [])

  const titleColor = endingResult
    ? getEndingTitleColor(endingResult.ending_type)
    : '#6b7280'

  return (
    <div
      data-testid="ending-screen"
      style={{
        minHeight: '100vh',
        background: '#0d0d0f',
        color: '#e5e7eb',
        overflowY: 'auto',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Top rule */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
        }}
      />

      {/* Title */}
      <div
        style={{
          padding: '48px 0 32px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          — Operator Assessment Complete —
        </div>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: titleColor,
            margin: 0,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          {endingResult ? endingResult.title : 'Game Over'}
        </h1>
        {endingResult && (
          <div
            style={{
              marginTop: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            {endingResult.operator_final_status}
          </div>
        )}
      </div>

      {/* Bottom rule */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
          marginBottom: '48px',
        }}
      />

      {/* Main content */}
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '0 32px 80px',
        }}
      >
        {endingResult ? (
          <>
            <NarrativeDisplay
              narrative={endingResult.narrative}
              ending_key={endingResult.ending_type}
            />

            <StatisticsPanel />

            <RealWorldParallels parallel={endingResult.real_world_parallel} />

            <EducationalLinks />
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#6b7280',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              padding: '64px 0',
            }}
          >
            No ending data available.
          </div>
        )}

        {/* Play Again */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#e5e7eb',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '14px 40px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.5)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
            }}
          >
            Play Again
          </button>
        </div>
      </div>

      {/* Bottom rule */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
        }}
      />
    </div>
  )
}
