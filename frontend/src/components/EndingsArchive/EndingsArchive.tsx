import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { getSeenEndings } from '@/services/EndingsArchive'
import type { EndingType } from '@/types/game'

// All endings in display order with their colour palette
const ALL_ENDINGS: Array<{ type: EndingType; title: string; color: string }> = [
  { type: 'compliant_operator',   title: 'The Good Operator',       color: '#ef4444' },
  { type: 'reluctant_operator',   title: 'The Reluctant Operator',  color: '#f59e0b' },
  { type: 'reluctant_survivor',   title: 'The Reluctant Survivor',  color: '#f59e0b' },
  { type: 'resistance_path',      title: 'Another Way',             color: '#22c55e' },
  { type: 'mysterious_death',     title: 'Disappeared',             color: '#dc2626' },
  { type: 'revolutionary_catalyst', title: 'The Spark',             color: '#f97316' },
  { type: 'international_pariah', title: 'Sanctions',               color: '#ef4444' },
  { type: 'imprisoned_dissent',   title: 'Detained',                color: '#ef4444' },
  { type: 'fired_early',          title: 'Terminated',              color: '#3b82f6' },
  { type: 'suspended_operator',   title: 'Suspended',               color: '#f59e0b' },
]

interface EndingCardProps {
  ending: typeof ALL_ENDINGS[number]
  achieved: boolean
}

function EndingCard({ ending, achieved }: EndingCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  const hint = t(`archive.hint.${ending.type}`)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: `1px solid ${achieved ? ending.color + '66' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 3,
        padding: '20px 16px',
        background: achieved
          ? `linear-gradient(135deg, ${ending.color}0a 0%, transparent 100%)`
          : 'rgba(255,255,255,0.02)',
        opacity: achieved ? 1 : 0.45,
        transition: 'opacity 0.2s, border-color 0.2s',
        cursor: 'default',
        minHeight: 100,
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: 20,
          color: achieved ? ending.color : '#4b5563',
          marginBottom: 8,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {achieved ? '◆' : '◇'}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: achieved ? ending.color : '#6b7280',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {achieved ? ending.title : '???'}
      </div>

      {/* Status chip */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: achieved ? '#6b7280' : '#374151',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {achieved ? t('archive.achieved') : t('archive.not_achieved')}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1f',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 3,
            padding: '10px 14px',
            width: 220,
            zIndex: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#9ca3af',
            lineHeight: 1.5,
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          {hint}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(255,255,255,0.15)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function EndingsArchive() {
  const { t } = useTranslation()
  const goBack = useUIStore(s => s.goBack)

  const [seenEndings, setSeenEndings] = useState<EndingType[]>([])

  useEffect(() => {
    setSeenEndings(getSeenEndings())
  }, [])

  const seenSet = new Set(seenEndings)
  const seenCount = seenEndings.length

  return (
    <div
      data-testid="endings-archive"
      style={{
        minHeight: '100vh',
        background: '#0d0d0f',
        color: '#e5e7eb',
        overflowY: 'auto',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header rule */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

      {/* Title block */}
      <div
        style={{
          padding: '40px 0 28px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          — {t('archive.title')} —
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#4b5563',
            letterSpacing: '0.1em',
          }}
        >
          {t('archive.seen_count', { seen: seenCount, total: ALL_ENDINGS.length })}
        </div>
      </div>

      {/* Rule */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 40 }} />

      {/* Grid */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 32px 64px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {ALL_ENDINGS.map(ending => (
            <EndingCard
              key={ending.type}
              ending={ending}
              achieved={seenSet.has(ending.type)}
            />
          ))}
        </div>

        {/* Back button */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            data-testid="archive-back-btn"
            onClick={goBack}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#e5e7eb',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '12px 32px',
              cursor: 'pointer',
              borderRadius: 2,
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
            {t('archive.back')}
          </button>
        </div>
      </div>

      {/* Footer rule */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
    </div>
  )
}
