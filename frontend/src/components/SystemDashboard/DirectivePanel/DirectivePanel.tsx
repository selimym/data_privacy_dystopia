import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { QuotaBar } from './QuotaBar'
import { IceRaidAlert } from './IceRaidAlert'
import type { ShiftMemoData } from '@/types/ui'

function buildShiftMemo(week: number, compliance: number, reluctance: number): Pick<ShiftMemoData, 'memoText' | 'tone'> {
  if (reluctance < 30 && compliance > 60) {
    return {
      tone: 'positive',
      memoText: `Operator performance for Directive Cycle ${week} is within acceptable parameters. Compliance metrics are satisfactory. Continue processing at current pace. Your commitment to the mission is noted.`,
    }
  }
  return {
    tone: 'warning',
    memoText: `Operator metrics for Directive Cycle ${week} require attention. Elevated hesitation patterns and/or suboptimal compliance rates have been logged. Review your processing efficiency. Continued deviations will be escalated to supervisory review.`,
  }
}

const WEEK6_TOTAL_SECONDS = 24 * 3600

function formatCountdown(secondsRemaining: number): string {
  const s = Math.max(0, secondsRemaining)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
}

export function DirectivePanel() {
  const { t } = useTranslation()
  const [memoRevealed, setMemoRevealed] = useState(false)
  const [countdown, setCountdown] = useState(WEEK6_TOTAL_SECONDS)
  const week6StartRef = useRef<number | null>(null)
  const memoShownRef = useRef<string | null>(null)

  const directive = useGameStore(s => s.currentDirective)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)
  const scenario = useContentStore(s => s.scenario)
  const compliance = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance.reluctance_score)
  const showShiftMemo = useUIStore(s => s.showShiftMemo)
  const pendingShiftMemo = useUIStore(s => s.pendingShiftMemo)

  const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver

  // Week 6 countdown timer
  useEffect(() => {
    if (weekNumber !== 6) return

    // Capture start time once when week 6 first renders
    if (week6StartRef.current === null) {
      week6StartRef.current = Date.now()
    }

    const tick = () => {
      const elapsed = (Date.now() - (week6StartRef.current ?? Date.now())) / 1000
      const remaining = Math.floor(WEEK6_TOTAL_SECONDS - elapsed)
      setCountdown(remaining)
    }

    tick()
    const intervalId = setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [weekNumber])

  // Auto-trigger shift memo when quota is met (production only; tests keep the button)
  useEffect(() => {
    if (isAutomated || !directive) return
    const completedCount = flags.filter(f => f.directive_key === directive.directive_key).length
    const met = completedCount >= directive.flag_quota
    if (!met || memoShownRef.current === directive.directive_key || pendingShiftMemo !== null) return

    memoShownRef.current = directive.directive_key
    const next = scenario?.directives.find(d => d.week_number === weekNumber + 1) ?? null
    const { memoText, tone } = buildShiftMemo(weekNumber, compliance, reluctance)
    showShiftMemo({ weekNumber, memoText, tone, nextDirective: next })
  }, [isAutomated, directive, flags, weekNumber, compliance, reluctance, pendingShiftMemo, scenario, showShiftMemo])

  const completedForDirective = directive
    ? flags.filter(f => f.directive_key === directive.directive_key).length
    : 0

  const quotaMet = directive !== null && completedForDirective >= directive.flag_quota

  const nextDirective = scenario?.directives.find(d => d.week_number === weekNumber + 1) ?? null

  const memoVisible = weekNumber >= 4 || memoRevealed

  if (!directive) {
    return (
      <div className="panel" data-testid="directive-panel">
        <div className="panel-title">{t('directive.panel.title')}</div>
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="panel" data-testid="directive-panel">
      <div className="panel-title">{t('directive.panel.title')}</div>

      <div style={{ padding: 12 }}>
        {/* Week label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          {t('directive.week_label', { week: weekNumber })}
        </div>

        {/* Week 6 countdown timer */}
        {weekNumber === 6 && (
          <div
            data-testid="week6-timer"
            style={{
              marginBottom: 10,
              padding: '8px 10px',
              background: countdown <= 0
                ? 'rgba(239, 68, 68, 0.12)'
                : countdown <= 4 * 3600
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(217, 119, 6, 0.08)',
              border: `1px solid ${countdown <= 4 * 3600 ? 'var(--color-red)' : 'var(--color-amber)'}`,
              borderRadius: 2,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              OPERATION DEADLINE:
            </div>
            {countdown <= 0 ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-red)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                TIME EXPIRED — MANDATORY PROCESSING
              </div>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: countdown <= 4 * 3600 ? 'var(--color-red)' : 'var(--color-amber)',
                  letterSpacing: '0.06em',
                }}
              >
                {formatCountdown(countdown)}
              </div>
            )}
          </div>
        )}

        {/* Directive title */}
        <div
          data-testid="directive-title"
          style={{
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 6,
            letterSpacing: '0.02em',
          }}
        >
          {directive.title}
        </div>

        {/* Description */}
        <div
          data-testid="directive-description"
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {directive.description}
        </div>

        {/* Quota progress */}
        <QuotaBar completed={completedForDirective} required={directive.flag_quota} />

        {/* Complete badge — always shown when quota met */}
        {quotaMet && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-green)',
                letterSpacing: '0.1em',
                marginBottom: 6,
              }}
            >
              {t('directive.complete')}
            </div>
            {/* Advance button shown only in automated test environments */}
            {isAutomated && (
              <button
                data-testid="advance-week-btn"
                onClick={() => useGameStore.getState().advanceDirective(nextDirective)}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  background: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid var(--color-amber)',
                  color: 'var(--color-amber)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                ADVANCE WEEK →
              </button>
            )}
          </div>
        )}

        {/* Internal memo */}
        {directive.internal_memo && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              {t('directive.internal_memo')}
            </div>
            {memoVisible ? (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                }}
              >
                {directive.internal_memo}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-red)',
                    letterSpacing: '0.08em',
                    flexGrow: 1,
                  }}
                >
                  {t('directive.memo_classified', { week: 4 })}
                </span>
                <button
                  onClick={() => setMemoRevealed(true)}
                  style={{
                    padding: '3px 7px',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  REVEAL
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ICE raid alerts */}
      <IceRaidAlert />
    </div>
  )
}
