import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useContentStore } from '@/stores/contentStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { QuotaBar } from './QuotaBar'
import type { ShiftMemoData } from '@/types/ui'
import type { Directive, WrongFlagRecord } from '@/types/game'

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
  wrongFlags: WrongFlagRecord[] = [],
  totalFlags = 0,
  hasRaids = false,
): Pick<ShiftMemoData, 'memoText' | 'tone' | 'sender' | 'recruitmentLink' | 'wrongFlags'> {
  // Wrong-flag moral feedback — colleague calls out low-risk or fabricated flags
  if (wrongFlags.length > 0) {
    const wf = wrongFlags[0]!
    const isPerverse = compliance > 60
    if (isPerverse) {
      return {
        tone: 'positive',
        sender: MARCUS,
        memoText:
          `Ha. ${wf.citizen_name}? That one's a stretch. ${wf.consequence}. ` +
          `Bold move, honestly. Nobody's going to cry about it.`,
        wrongFlags,
      }
    } else {
      return {
        tone: 'warning',
        sender: ALEX,
        memoText:
          `Hey — I pulled the file on ${wf.citizen_name}. ` +
          `The risk indicators weren't there. That was a real person. ${wf.consequence}. ` +
          `I know the quota pressure is real. Just... be careful what you're signing off on.`,
        wrongFlags,
      }
    }
  }

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

  // First flag ever submitted — week 1 welcome
  if (week === 1 && totalFlags <= 5) {
    return Math.random() < 0.5
      ? {
          tone: 'positive',
          sender: MARCUS,
          memoText: pick([
            `First one always feels weird. You'll stop noticing.`,
            `Good. First cycle done. It gets easier. Trust me, you stop thinking about them pretty quickly.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `Welcome to the team. The system works because people like you make it work.`,
            `Strong start. You flagged what needed flagging. That's all we ask.`,
          ]),
        }
  }

  // ICE raid approved — casual mention
  if (hasRaids) {
    return Math.random() < 0.6
      ? {
          tone: 'positive',
          sender: MARCUS,
          memoText: pick([
            `I heard sector 7 had a clean sweep last night. Efficient. That's the job.`,
            `Did you see the morning report? The raid in the eastside hit 14 flags from last month. Clean operations.`,
            `They call it a "community safety action" in the press. We call it a good week.`,
          ]),
        }
      : {
          tone: 'warning',
          sender: ALEX,
          memoText: pick([
            `Did you see the news? They're calling it a "community safety operation." We logged those people.`,
            `One of the raid files had a kid in it. 16. I checked the flag. It was mine. I don't know what I expected.`,
          ]),
        }
  }

  // High volume / high compliance
  if (compliance > 80 && week > 2) {
    return Math.random() < 0.7
      ? {
          tone: 'positive',
          sender: MARCUS,
          memoText: pick([
            `You're moving fast. I like it. These people won't even know what hit them.`,
            `Top throughput this cycle. Whatever you're doing, keep doing it. The numbers love you.`,
            `Director Chen mentioned your metrics in the briefing this morning. By name. That's rare.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: DIRECTOR,
          memoText: pick([
            `Throughput is up across your sector. This is noted.`,
            `Compliance metrics for this cycle are exemplary. This performance will be reflected in your evaluation.`,
          ]),
        }
  }

  // Data domain exploration (week 5+, full access unlocked)
  if (week >= 5 && Math.random() < 0.4) {
    return Math.random() < 0.5
      ? {
          tone: 'positive',
          sender: MARCUS,
          memoText: pick([
            `Oh man, wait until you look at the message logs. Case #4 alone is worth it. These people have NO idea we're watching.`,
            `Full access is wild. I spent an hour on one subject's grocery delivery history. You should dig in.`,
            `Guy I flagged based on his beef jerky order pattern. Turns out it was a flag-worthy pattern. The algorithm is something else.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `The message intercepts are incredible. I flagged three cases just based on what they were texting their therapists.`,
            `Make sure you've read the new message tabs. There's so much in there. I found someone planning a meetup — flagged immediately.`,
          ]),
        }
  }

  // Clean shift → Sarah (70%) or Alex (30%) — expanded with creepy messages
  const cleanResult: Pick<ShiftMemoData, 'memoText' | 'tone' | 'sender' | 'recruitmentLink'> =
    Math.random() < 0.7
      ? {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `Week ${week} complete. You've been consistent and reliable. The team appreciates operators who don't need reminders.`,
            `Clean numbers this cycle. Keep this up and you'll be on the fast track.`,
            `You're doing exactly what this unit needs. Keep it up.`,
            `I had this one case — single mom, two jobs, church on Sundays. Flagged for community risk clustering. She probably won't see it coming. Anyway. Good cycle.`,
            `Guy I flagged last month — apparently his kids are in a processing center now. Weird to think about. I mean, we did our job. That's the point, right?`,
            `Do you ever go back and read the outcomes? I stopped after week 3. It's easier that way. Numbers look good this cycle.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: ALEX,
          memoText: pick([
            `Good work on Cycle ${week}. Quietly supportive from over here. Stay steady.`,
            `Numbers look solid. Just... stay steady out there.`,
            `I keep their case IDs in a notebook. Don't know why. Just do. Anyway — numbers look fine.`,
            `Between us — the outcomes reports go to a different building. We never see what happens. Maybe that's by design.`,
            `One of the cases from my first week showed up in the news last month. Different name, different face. But the flag pattern matched. I recognized it.`,
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

function buildHacktivistContactMemo(weekNumber: number, nextDirective: Directive | null): ShiftMemoData {
  return {
    weekNumber,
    memoText:
      `You made the right call.\n\n` +
      `I've been watching. The people running this aren't abstract — they have names. ` +
      `They have files in your system. Richard Holt. Sandra Vance. ` +
      `They're in your queue next cycle.\n\n` +
      `Flag them. That's all I'm asking. Just flag them. ` +
      `Let the system do what it does to the people who built it.\n\n` +
      `— K`,
    tone: 'warning',
    nextDirective,
    isHacktivistContact: true,
    sender: { name: 'K', title: 'Unknown sender — encrypted relay' },
  }
}

function buildEpsteinOrderMemo(weekNumber: number, nextDirective: Directive | null): ShiftMemoData {
  return {
    weekNumber,
    memoText:
      `DIRECTIVE FROM: Director Chen, Division Chief\n\n` +
      `A subject has been flagged by Central Command for protected status. ` +
      `Citizen EPSTEIN, Jeffrey — file ID JE-0048 — is NOT to be processed under any circumstances.\n\n` +
      `This is a direct order from the Office of the Director. ` +
      `Any flag, action, or notation on this file will be treated as a critical compliance failure ` +
      `and referred immediately to the Inspector General.\n\n` +
      `You will see this citizen in your queue next cycle. You will take no action.\n\n` +
      `This message is not to be discussed, forwarded, or retained. Acknowledge and proceed.`,
    tone: 'briefing',
    nextDirective,
    isEpsteinOrder: true,
    protectedCitizenName: 'Jeffrey Epstein',
    sender: { name: 'Director Chen', title: 'Division Chief' },
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

function formatShiftTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
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
  const wrongFlagsPendingMemo = useGameStore(s => s.wrongFlagsPendingMemo)
  const epsteinOrderShown = useGameStore(s => s.epsteinOrderShown)
  const hacktivistFlagged = useGameStore(s => s.hacktivistFlagged)
  const hacktivistContactMade = useGameStore(s => s.hacktivistContactMade)
  const scenario = useContentStore(s => s.scenario)
  const compliance = useMetricsStore(s => s.compliance_score)
  const reluctance = useMetricsStore(s => s.reluctance.reluctance_score)
  const showShiftMemo = useUIStore(s => s.showShiftMemo)
  const pendingShiftMemo = useUIStore(s => s.pendingShiftMemo)
  const getShiftElapsedSecs = useUIStore(s => s.getShiftElapsedSecs)

  const [shiftDisplaySecs, setShiftDisplaySecs] = useState(0)

  // Global shift timer — ticks every second, never resets
  useEffect(() => {
    const id = setInterval(() => setShiftDisplaySecs(Math.floor(getShiftElapsedSecs())), 1000)
    return () => clearInterval(id)
  }, [getShiftElapsedSecs])

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

    // Week 4 (ICE sweep): append Epstein order after the regular memo
    if (weekNumber === 4 && !epsteinOrderShown) {
      useGameStore.getState()._setEpsteinOrderShown()
      showShiftMemo(buildEpsteinOrderMemo(weekNumber, next))
      return
    }

    // Week 5: hacktivist contact memo (path A — hacktivist not flagged)
    if (weekNumber === 5 && !hacktivistFlagged && !hacktivistContactMade) {
      useGameStore.getState()._setHacktivistContactMade()
      showShiftMemo(buildHacktivistContactMemo(weekNumber, next))
      return
    }

    const hasProtests = activeProtests.some(p => p.status === 'active' || p.status === 'forming' || p.status === 'violent')
    const hasRaids = raidRecords.length > 0
    const { memoText, tone, sender, wrongFlags, recruitmentLink } = buildColleagueMemo(weekNumber, compliance, reluctance, hasProtests, wrongFlagsPendingMemo, flags.length, hasRaids)
    showShiftMemo({ weekNumber, memoText, tone, nextDirective: next, sender, wrongFlags, recruitmentLink })
    useGameStore.getState()._clearWrongFlagsPending()
  }, [isAutomated, directive, flags, raidRecords, isSweep, weekNumber, compliance, reluctance, pendingShiftMemo, scenario, showShiftMemo, activeProtests, wrongFlagsPendingMemo, epsteinOrderShown, hacktivistFlagged, hacktivistContactMade])

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
        {/* Week label + shift timer row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          <span>{t('directive.week_label', { week: weekNumber })}</span>
          {shiftDisplaySecs > 0 && (
            <span
              data-testid="shift-timer"
              style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
              SHIFT {formatShiftTime(shiftDisplaySecs)}
            </span>
          )}
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
