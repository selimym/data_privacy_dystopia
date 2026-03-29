import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { getSeenEndings } from '@/services/EndingsArchive'
import type { EndingType } from '@/types/game'

const ALL_ENDINGS: Array<{ type: EndingType; title: string; color: string }> = [
  { type: 'compliant_operator',     title: 'The Good Operator',        color: '#ef4444' },
  { type: 'reluctant_operator',     title: 'The Reluctant Operator',   color: '#f59e0b' },
  { type: 'reluctant_survivor',     title: 'The Reluctant Survivor',   color: '#f59e0b' },
  { type: 'resistance_path',        title: 'Another Way',              color: '#22c55e' },
  { type: 'mysterious_death',       title: 'Disappeared',              color: '#dc2626' },
  { type: 'revolutionary_catalyst', title: 'The Spark',                color: '#f97316' },
  { type: 'international_pariah',   title: 'Sanctions',                color: '#ef4444' },
  { type: 'imprisoned_dissent',     title: 'Detained',                 color: '#ef4444' },
  { type: 'fired_early',            title: 'Terminated',               color: '#3b82f6' },
  { type: 'suspended_operator',     title: 'Suspended',                color: '#f59e0b' },
]

interface EndingCardProps {
  ending: typeof ALL_ENDINGS[number]
  achieved: boolean
}

function EndingCard({ ending, achieved }: EndingCardProps) {
  const { t } = useTranslation()
  const [imgFailed, setImgFailed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hint = t(`archive.hint.${ending.type}`)
  const imageSrc = `/assets/endings/${ending.type}.png`

  return (
    <div
      data-testid={`ending-card-${ending.type}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${achieved ? ending.color + '55' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 3,
        overflow: 'hidden',
        background: achieved
          ? `linear-gradient(170deg, ${ending.color}0d 0%, rgba(13,13,15,0.95) 55%)`
          : 'rgba(255,255,255,0.015)',
        opacity: achieved ? 1 : hovered ? 0.65 : 0.42,
        transition: 'opacity 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: achieved ? `0 0 18px ${ending.color}15` : 'none',
      }}
    >
      {/* ── Image area ──────────────────────────────────────── */}
      <div
        style={{
          height: 90,
          position: 'relative',
          overflow: 'hidden',
          background: achieved
            ? `linear-gradient(135deg, ${ending.color}22 0%, ${ending.color}08 60%, transparent 100%)`
            : 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid ${achieved ? ending.color + '33' : 'rgba(255,255,255,0.05)'}`,
          flexShrink: 0,
        }}
      >
        {!imgFailed ? (
          <img
            src={imageSrc}
            alt={achieved ? ending.title : '???'}
            onError={() => setImgFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: achieved ? 'none' : 'grayscale(100%) brightness(0.4)',
            }}
          />
        ) : (
          /* Placeholder — replace with real art later */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 32,
              color: achieved ? ending.color : '#2d2d35',
              letterSpacing: '-0.02em',
              userSelect: 'none',
            }}
          >
            {achieved ? '◆' : '◇'}
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,15,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '12px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Title row */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: achieved ? ending.color : '#4b5563',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
          }}
        >
          {achieved ? ending.title : '???'}
        </div>

        {/* Hint text — always visible inside the card */}
        <div
          data-testid={`ending-hint-${ending.type}`}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: achieved ? '#9ca3af' : hovered ? '#6b7280' : '#374151',
            lineHeight: 1.55,
            flex: 1,
            transition: 'color 0.15s',
          }}
        >
          {achieved ? hint : hovered ? hint : '[ LOCKED ]'}
        </div>

        {/* Status chip */}
        <div
          style={{
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: achieved ? ending.color : '#374151',
            borderTop: `1px solid ${achieved ? ending.color + '33' : 'rgba(255,255,255,0.05)'}`,
            paddingTop: 8,
          }}
        >
          <span style={{ fontSize: 7 }}>{achieved ? '●' : '○'}</span>
          {achieved ? t('archive.achieved') : t('archive.not_achieved')}
        </div>
      </div>
    </div>
  )
}

export default function EndingsArchive() {
  const { t } = useTranslation()
  const goBack = useUIStore(s => s.goBack)
  const setScreen = useUIStore(s => s.setScreen)
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
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '36px 0 24px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.5)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          data-testid="archive-menu-btn"
          onClick={() => setScreen('start')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#9ca3af',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '7px 16px',
            cursor: 'pointer',
            borderRadius: 2,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.45)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
          }}
        >
          ← MENU
        </button>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.35em',
            color: '#4b5563',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          — {t('archive.title')} —
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 200,
            margin: '0 auto 10px',
            height: 2,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(seenCount / ALL_ENDINGS.length) * 100}%`,
              background: seenCount === ALL_ENDINGS.length ? '#22c55e' : '#f59e0b',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#4b5563',
            letterSpacing: '0.1em',
          }}
        >
          {t('archive.seen_count', { seen: seenCount, total: ALL_ENDINGS.length })}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 32px 64px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
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

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <button
            data-testid="archive-back-btn"
            onClick={goBack}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#9ca3af',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '11px 36px',
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.45)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
            }}
          >
            {t('archive.back')}
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}
