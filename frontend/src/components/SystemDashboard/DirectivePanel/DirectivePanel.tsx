import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { QuotaBar } from './QuotaBar'
import type { ShiftMemoData } from '@/types/ui'
import type { Directive } from '@/types/game'

// ─── Colleague-voice memo generator ──────────────────────────────────────────

interface ColleagueSender {
  name: string
  title: string
}

const SARAH: ColleagueSender = { name: 'Sarah K.', title: 'Senior Analyst' }
const MARCUS: ColleagueSender = { name: 'Marcus D.', title: 'Field Coordinator' }
const DIRECTOR: ColleagueSender = { name: 'Director Chen', title: 'Division Chief' }
const ALEX: ColleagueSender = { name: 'Alex R.', title: 'Compliance Officer' }
const PALANTIR_RECRUITER: ColleagueSender = { name: 'J. Moyer (fwd)', title: 'Talent Intelligence · Palantir Technologies' }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function buildColleagueMemo(
  week: number,
  compliance: number,
  reluctance: number,
  hasProtests: boolean,
): Pick<ShiftMemoData, 'memoText' | 'tone' | 'sender' | 'recruitmentLink'> {
  // Exploration week — special templates
  if (week === 5) {
    if (Math.random() < 0.5) {
      return {
        tone: 'positive',
        sender: MARCUS,
        memoText: pick([
          `Okay did you look at the message logs? Because I've been reading through some of these and — buddy. Case #4 alone is worth it. These people have NO idea we're watching.`,
          `Full access is wild. I spent an hour on one subject's grocery delivery history. You should dig in before we're back to quota grind.`,
        ]),
      }
    } else {
      return {
        tone: 'positive',
        sender: SARAH,
        memoText: pick([
          `Make sure you've explored the new social and message tabs! There's so much in there. I found someone planning a meetup — flagged immediately. This is exactly the kind of intelligence work that makes a difference.`,
          `The message intercepts are incredible. I flagged three cases just based on what they were texting their therapists. Take your time this week — there's a lot to find.`,
        ]),
      }
    }
  }

  // Protest condition → Marcus (70%) or Sarah-in-denial (30%)
  if (hasProtests) {
    if (Math.random() < 0.7) {
      return {
        tone: 'warning',
        sender: MARCUS,
        memoText: pick([
          `Ha. Saw the news. Guess we ruffled some feathers out there. Anyway, onto the next cycle — try not to start a second one.`,
          `People are upset. Good. Means we're doing something. See you tomorrow.`,
          `Riot in the streets. Classic. You flag 'em, they march. We flag more. Circle of life.`,
        ]),
      }
    } else {
      return {
        tone: 'positive',
        sender: SARAH,
        memoText: pick([
          `There's some noise out there but don't let it distract you. The work we're doing matters. Stay focused.`,
          `I know the news looks bad but remember why we're here. Keep your head down and keep processing.`,
        ]),
      }
    }
  }

  // Bad metrics → Director Chen (60%) or Alex (40%)
  if (compliance < 45 || reluctance > 60) {
    if (Math.random() < 0.6) {
      return {
        tone: 'warning',
        sender: DIRECTOR,
        memoText: pick([
          `Your reluctance indicators for Cycle ${week} are outside acceptable parameters. A formal review may be initiated if this continues. This is your advisory notice.`,
          `Compliance at ${compliance.toFixed(0)}%. The division expects above 60. I trust you understand the implications.`,
          `I'll be direct: your numbers are not where they need to be. This is a performance matter.`,
        ]),
      }
    } else {
      return {
        tone: 'warning',
        sender: ALEX,
        memoText: pick([
          `Hey — just wanted to say, watch your numbers. Not trying to pressure you, just... people are paying attention.`,
          `Cycle ${week} done. Your hesitation flags are ticking up. Nothing critical yet, but be careful.`,
          `Between us — some of these directives are getting heavy. Just... do what you can and keep your head down.`,
        ]),
      }
    }
  }

  // Moderate reluctance → Alex (70%) or Director (30%)
  if (reluctance > 30) {
    if (Math.random() < 0.7) {
      return {
        tone: 'warning',
        sender: ALEX,
        memoText: pick([
          `Hey — just wanted to say, watch your numbers. Not trying to pressure you, just... people are paying attention.`,
          `Cycle ${week} done. You're doing fine, but your hesitation flags are ticking up. Nothing critical yet.`,
          `Between us — some of these directives are getting heavy. Just... do what you can and keep your head down.`,
        ]),
      }
    } else {
      return {
        tone: 'warning',
        sender: DIRECTOR,
        memoText: pick([
          `Cycle ${week} performance noted. Numbers are within range but trending in the wrong direction. Monitor accordingly.`,
          `I trust you're aware of your metrics. The division tracks everything. That's all.`,
        ]),
      }
    }
  }

  // Clean shift → Sarah (70%) or Alex (30%)
  const cleanResult: Pick<ShiftMemoData, 'memoText' | 'tone' | 'sender' | 'recruitmentLink'> =
    Math.random() < 0.7
      ? {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `Week ${week} complete. You've been consistent and reliable. The team appreciates operators who don't need reminders.`,
            `Clean numbers this cycle. Keep this up and you'll be on the fast track.`,
            `You're doing exactly what this unit needs. Keep it up.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: ALEX,
          memoText: pick([
            `Good work on Cycle ${week}. Quietly supportive from over here. Stay steady.`,
            `Numbers look solid. Just... stay steady out there.`,
          ]),
        }

  // Easter egg — high compliance on a morally compromised shift catches
  // the attention of a certain data-analytics contractor.
  if (compliance >= 70 && week >= 3) {
    return {
      ...cleanResult,
      sender: PALANTIR_RECRUITER,
      memoText:
        `Operator SYS-OP-001,\n\n` +
        `Your performance indicators have been surfaced by our proprietary talent-identification pipeline. ` +
        `Compliance rate, decision throughput, and hesitation frequency all fall within our preferred operator profile.\n\n` +
        `We believe high-functioning individuals deserve opportunities that match their capabilities. ` +
        `A pre-qualified talent file has been generated in your name.\n\n` +
        `This message will not be re-sent.`,
      recruitmentLink: {
        label: 'ACCESS YOUR TALENT PROFILE',
        href: 'https://www.youtube.com/watch?v=3iEgxLXOQBI',
      },
    }
  }

  return cleanResult
}

function buildBriefingMemo(directive: Directive, prevWeek: number, newDomains: string[]): ShiftMemoData {
  let body = `${directive.title}\n\n${directive.description}`

  if (newDomains.length > 0) {
    body += `\n\nNEW DATA ACCESS UNLOCKED:\n${newDomains.map(d => `• ${d.toUpperCase()}`).join('\n')}`
  }

  body += `\n\nQuota: ${directive.flag_quota} ${(directive.directive_type ?? 'review') === 'sweep' ? 'arrests' : 'flags'} required.`

  return {
    weekNumber: prevWeek,
    memoText: body,
    tone: 'briefing',
    nextDirective: directive,
    isBriefing: true,
  }
}

const WEEK8_TOTAL_SECONDS = 24 * 3600

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
  const [countdown, setCountdown] = useState(WEEK8_TOTAL_SECONDS)
  const week8StartRef = useRef<number | null>(null)
  const memoShownRef = useRef<string | null>(null)
  const briefingShownRef = useRef<string | null>(null)

  const directive = useGameStore(s => s.currentDirective)
  const weekNumber = useGameStore(s => s.weekNumber)
  const flags = useGameStore(s => s.flags)
  const raidRecords = useGameStore(s => s.raidRecords)
  const activeProtests = useGameStore(s => s.activeProtests)
  const scenario = useContentStore(s => s.scenario)
  const compliance = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance.reluctance_score)
  const showShiftMemo = useUIStore(s => s.showShiftMemo)
  const pendingShiftMemo = useUIStore(s => s.pendingShiftMemo)

  const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver
  const isSweep = (directive?.directive_type ?? 'review') === 'sweep'

  // Week 8 countdown timer (final directive)
  useEffect(() => {
    if (weekNumber !== 8) return

    if (week8StartRef.current === null) {
      week8StartRef.current = Date.now()
    }

    const tick = () => {
      const elapsed = (Date.now() - (week8StartRef.current ?? Date.now())) / 1000
      const remaining = Math.floor(WEEK8_TOTAL_SECONDS - elapsed)
      setCountdown(remaining)
    }

    tick()
    const intervalId = setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [weekNumber])

  // Briefing memo: show at start of each week from week 2 onward (production only)
  useEffect(() => {
    if (isAutomated || !directive || weekNumber < 2) return
    if (briefingShownRef.current === directive.directive_key) return
    if (pendingShiftMemo !== null) return

    briefingShownRef.current = directive.directive_key

    // Determine newly unlocked domains for this directive
    const prevDirective = scenario?.directives.find(d => d.week_number === weekNumber - 1)
    const prevDomains = new Set(prevDirective?.required_domains ?? [])
    const newDomains = directive.required_domains.filter(d => !prevDomains.has(d))

    // Also include contract event domains for this week
    const contractEvent = scenario?.contract_events.find(ce => ce.week_number === weekNumber)
    if (contractEvent) {
      contractEvent.new_domains_unlocked.forEach(d => {
        if (!newDomains.includes(d)) newDomains.push(d)
      })
    }

    const briefing = buildBriefingMemo(directive, weekNumber - 1, newDomains)
    showShiftMemo(briefing)
  }, [isAutomated, directive, weekNumber, pendingShiftMemo, scenario, showShiftMemo])

  // Auto-trigger end-of-shift memo when quota is met (production only)
  useEffect(() => {
    if (isAutomated || !directive) return

    const completedCount = isSweep
      ? raidRecords
          .filter(r => r.directive_key === directive.directive_key)
          .reduce((sum, r) => sum + r.actual_arrests, 0)
      : flags.filter(f => f.directive_key === directive.directive_key).length

    const met = completedCount >= directive.flag_quota
    if (!met || memoShownRef.current === directive.directive_key || pendingShiftMemo !== null) return

    memoShownRef.current = directive.directive_key
    const next = scenario?.directives.find(d => d.week_number === weekNumber + 1) ?? null

    const hasProtests = activeProtests.some(p => p.status === 'active' || p.status === 'forming' || p.status === 'violent')
    const { memoText, tone, sender } = buildColleagueMemo(weekNumber, compliance, reluctance, hasProtests)
    showShiftMemo({ weekNumber, memoText, tone, nextDirective: next, sender })
  }, [isAutomated, directive, flags, raidRecords, isSweep, weekNumber, compliance, reluctance, pendingShiftMemo, scenario, showShiftMemo, activeProtests])

  const completedForDirective = directive
    ? isSweep
      ? raidRecords
          .filter(r => r.directive_key === directive.directive_key)
          .reduce((sum, r) => sum + r.actual_arrests, 0)
      : flags.filter(f => f.directive_key === directive.directive_key).length
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

        {/* Week 8 countdown timer */}
        {weekNumber === 8 && (
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
    </div>
  )
}
