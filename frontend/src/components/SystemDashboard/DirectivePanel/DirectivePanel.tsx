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
        memoText: pick([
          `${wf.citizen_name}. Ha. File was thin, you flagged anyway. ${wf.consequence}. The quota doesn't care about your sourcing. Neither do I.`,
          `I looked up ${wf.citizen_name} after. Risk score was a 12. You flagged at a 12. That's entrepreneurial. The system accepted it. That's the whole game, really.`,
          `Bold call on ${wf.citizen_name}. The indicators weren't there but you committed anyway. ${wf.consequence}. Some operators freeze up without certainty. You didn't. That's useful.`,
        ]),
        wrongFlags,
      }
    } else {
      return {
        tone: 'warning',
        sender: ALEX,
        memoText: pick([
          `I pulled ${wf.citizen_name}'s file after you submitted. Risk score was in the green. ${wf.consequence}. The flag is logged under your operator ID. If someone reviews the justification, it won't hold.`,
          `${wf.citizen_name}. The indicators weren't there. ${wf.consequence}. I've been doing this six years and I still can't fully convince myself it doesn't matter. I don't know what that says about either of us.`,
          `That flag on ${wf.citizen_name} is going to sit in the system for years. ${wf.consequence}. I'm not reporting it. But I want you to know I noticed. That's all.`,
        ]),
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
          `You know what's the weirdest part of full access? They're so ordinary. You expect terrorists. You get grocery lists. Book clubs. Someone anxious about their credit score. The algorithm flags all of it the same way.`,
          `I spent two hours in the message logs today. One guy's entire search history is anxiety meds and job listings. Another one's planning a birthday party for his dad. Both flagged by the system. I just... confirmed.`,
          `Full message access is something else. I found a woman in her 40s texting her sister every night about her marriage. Financial stress. Kids. All of it in there. I flagged the husband based on three of those messages. His risk score jumped 28 points.`,
        ]),
      }
    } else {
      return {
        tone: 'positive',
        sender: SARAH,
        memoText: pick([
          `Did you go through the healthcare tab yet? One subject has been managing a chronic condition for years — never disclosed it at work. All right there. Every appointment, every prescription. The completeness is actually impressive.`,
          `The message intercepts are worth going through slowly. I flagged three people this cycle just based on what they were telling their therapists. Technically that data is supposed to be protected. Technically.`,
          `I read an article last month claiming surveillance is impersonal. I wanted to laugh. You know what's in these files. It's extremely personal. We just can't say that out loud.`,
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
          `I heard they dispersed the 5th Street march around 11pm. Rubber rounds, mostly. Anyway — the queue doesn't pause because people are upset.`,
          `I don't watch the protest footage anymore. Not because it bothers me. I just find it boring. People yelling at buildings. We're still in here processing. That's the actual work.`,
          `My neighbor asked if I knew anything about the flagging operations. I told her I work in data compliance. She dropped it. It's remarkable how far "data compliance" gets you at a dinner party.`,
          `Riot in the streets. Queue still full. Circle of life.`,
        ]),
      }
    } else {
      return {
        tone: 'positive',
        sender: SARAH,
        memoText: pick([
          `I saw a face on the news from the protest this morning. Recognized the risk cluster from last cycle. I flagged that cluster. It was the right call. I keep reminding myself of that.`,
          `There's noise out there. There always is when systems like ours start working. Remember why this exists. The alternative isn't peace — it's just unmanaged risk.`,
          `I know the coverage looks bad. It always does at first. Stay in the data. The data doesn't editorialize.`,
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
          `Your hesitation rate for Cycle ${week} has been flagged to HR as a precautionary notation. No action is being taken at this time. That can change.`,
          `${compliance.toFixed(0)}% compliance. Contract performance threshold is 65%. I don't make these calls personal. The metrics do it for me.`,
          `There is no space in this division for operators who second-guess the scoring engine. The engine is the judgment. Your job is to confirm it, not to audit it.`,
          `Cycle ${week} performance will be included in the next divisional audit. I suggest you read pages 22–24 of the operator manual before that review. Specifically the section on hesitation logging.`,
        ]),
      }
    } else {
      return {
        tone: 'warning',
        sender: ALEX,
        memoText: pick([
          `Director Chen asked me about your metrics today. I told her I'd follow up. This is me following up: the next cycle needs to look different. I can't run interference twice.`,
          `The system logs every review pause over 45 seconds. Did you know that? It's in the manual. Your pause rate for Cycle ${week} is in the 94th percentile. People are noticing.`,
          `Your numbers are attracting attention from the compliance layer. I don't know what's going on with you, but if you want to keep your clearance level, that changes next cycle.`,
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
          `I see the hesitation indicators in the system. I'm not escalating yet. "Yet" is doing a lot of work in that sentence.`,
          `The system logs every pause over 45 seconds on a file. Your rate this cycle is elevated. Just so you know what they're seeing.`,
          `Some of these directives are getting heavier. I get it. But the paper trail doesn't care about that — it just records the delay. Keep moving.`,
        ]),
      }
    } else {
      return {
        tone: 'warning',
        sender: DIRECTOR,
        memoText: pick([
          `Cycle ${week} reviewed. Response time on flags is within tolerance. Hesitation rate is not. Adjust.`,
          `I trust you understand that the scoring engine doesn't require your agreement. It requires your input. There's a difference.`,
          `Numbers are within range. Trending is not. I don't flag trends — I flag patterns. You are approaching a pattern.`,
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
            `First cycle done. It's weird at first, looking at real people's files. Most operators stop noticing the details by week three. That's not cynicism — that's calibration.`,
            `The first hundred are always the slowest. After that your brain starts pattern-matching and it's just throughput. You'll get there.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `Good work today. The ones who struggle are the ones who keep asking what happens after. Don't ask that. The system handles what happens after.`,
            `Strong start. And for what it's worth — the algorithm isn't guessing. When you flag someone, it's because the data already said they should be flagged. Your job is confirmation, not judgment. That distinction protects you.`,
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
            `Morning report had numbers from the eastside operation. 23 detentions, 4 referred for processing. I traced it back — our flags fed directly into that list. Eleven of them were ours. Efficient afternoon.`,
            `Operations said the turnaround from flag to action is down to 48 hours now. Used to take weeks. That's what this system was built for. You're part of that number.`,
            `They ran a sweep in sector 9 last night. Clean operation. I ran the correlation — we contributed to that list. I feel good about the work. The numbers are doing what they're supposed to do.`,
          ]),
        }
      : {
          tone: 'warning',
          sender: ALEX,
          memoText: pick([
            `One of the sweep targets from last cycle had a hospital appointment flagged in their record. They didn't make it to the appointment. I found out through the outcomes report. I filed the original risk notation on that file. I'm keeping a personal log. I don't know why. I just am.`,
            `The outcomes from the eastside operation posted to the internal board today. I looked for the names. I didn't recognize them as names — just as case IDs I'd reviewed. That's probably the healthy response. I genuinely don't know anymore.`,
            `One of the raid files had a 16-year-old listed as a household member. Flagged as secondary risk. I checked who submitted the primary flag. It was me. I don't know what I expected to find when I looked that up.`,
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
            `Director Chen mentioned your throughput in the morning brief. By name. I've been here four years and I can count the times she's done that on one hand.`,
            `I looked at your flag distribution. Low-risk, high-frequency, clean justifications. Consistent. Most people overthink this job. You're not overthinking it. That's the thing.`,
            `You're not asking why. That's rarer than you'd think. The operators who burn out are the ones who keep asking why. You're just processing. That's a skill. Seriously.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: DIRECTOR,
          memoText: pick([
            `Cycle ${week} metrics are in the top quartile for the division. This has been forwarded to the review board as a commendation entry. Maintain pace.`,
            `Operators performing at this level attract different kinds of attention. That is not a warning. That is information. Keep processing.`,
            `Performance noted. Opportunities open at this level. I don't say that to everyone.`,
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
            `I flagged someone this cycle based on their commute pattern and three grocery orders. The algorithm had already scored them at 67. I just confirmed it. That's what full access looks like in practice.`,
            `Go through the message logs when you get a chance. The subjects don't write like they think anyone's reading. That's where the real picture is.`,
            `One guy I reviewed — his entire digital footprint is just anxiety and job applications. The system flagged him at 71. I confirmed. He has no idea. That's not surveillance — that's just physics at this point.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: SARAH,
          memoText: pick([
            `The healthcare intercepts are worth your time. People share things with their doctors they won't share anywhere else. It's all in the record. All indexed. The completeness is actually remarkable.`,
            `I found a woman this cycle managing a health condition for years — never told her employer. All of it is in the file. The system scored her at 58 before I even opened the health tab. After: 81.`,
            `Message intercepts are where the context lives. The financial and health data tells you what. The messages tell you why. Flag the why.`,
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
            `Cycle ${week} closed. I stopped reading the outcomes after my third month. My supervisor told me it helps. She was right. It does.`,
            `I flagged someone last cycle. Before I submitted I looked at their social tab — photos of a kid's soccer game, mostly. Then their financial record. Then I hit submit. You get good at keeping those two things separate. It takes a few weeks.`,
            `I've been doing this three years. The ones I remember aren't the high-risk flags. It's the edge cases. The 58s and 61s. The people who almost made it out of the algorithm.`,
            `You know what nobody tells you in training? The work is just ordinary. Process, review, submit, log. That's the whole thing. Somewhere else in the city, something is happening. You just don't see that part.`,
            `I had a case last cycle — single mother, two jobs, church on Sundays. Flagged for community risk clustering. She probably doesn't know we exist. That used to feel like something. Now it just feels like a shift.`,
            `Guy I flagged two months ago — his kids ended up in a processing center. I know because it came through the outcomes summary. We did the job. That is the point. I keep saying that to myself and it keeps being true.`,
          ]),
        }
      : {
          tone: 'positive',
          sender: ALEX,
          memoText: pick([
            `I've started keeping a personal log. Not system-accessible. Just a record of the sequence of decisions. In case it ever matters to someone that it was documented. Anyway — numbers look fine.`,
            `I asked Legal once what happens to a subject's record after they're processed. They transferred the question back to HR. HR transferred it to a form. I stopped asking.`,
            `Week ${week}. Still here. I keep returning to the wording on Form 4-B: "likely risk indicator." What percentage is "likely"? Nobody's defined it. We're all just agreeing not to ask.`,
            `Between us — the outcomes reports go to a different building. We sign the flags; someone else reads what comes after. I think that's deliberate. I think it's actually quite well designed.`,
            `One of my flags from the first week showed up in the news last month. Different name in the article. Different face. But I recognized the risk pattern. It was mine. I don't know what I expected to feel.`,
            `I keep their case IDs in a notebook. Just the IDs — nothing else. I couldn't tell you why. Maybe so I know the list has a length. That it isn't just a number on a dashboard.`,
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
      `You will see this citizen in your queue this cycle. You will take no action.\n\n` +
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
  const suppressBriefingForKey = useUIStore(s => s.suppressBriefingForKey)

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

    // If the end-of-shift overlay already included this directive's briefing, skip
    if (suppressBriefingForKey === directive.directive_key) {
      useUIStore.getState().setSuppressBriefingForKey(null)
      return
    }

    // Week 6: Epstein order arrives as the beginning-of-shift memo
    if (weekNumber === 6 && !epsteinOrderShown) {
      useGameStore.getState()._setEpsteinOrderShown()
      showShiftMemo(buildEpsteinOrderMemo(weekNumber, null))
      return
    }

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
  }, [isAutomated, directive, weekNumber, pendingShiftMemo, scenario, showShiftMemo, epsteinOrderShown, suppressBriefingForKey])

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

    // Week 5: hacktivist contact memo (path A — hacktivist not flagged)
    if (weekNumber === 5 && !hacktivistFlagged && !hacktivistContactMade) {
      useGameStore.getState()._setHacktivistContactMade()
      showShiftMemo(buildHacktivistContactMemo(weekNumber, next))
      return
    }

    const hasProtests = activeProtests.some(p => p.status === 'active' || p.status === 'forming' || p.status === 'violent')
    const hasRaids = raidRecords.length > 0
    const { memoText, tone, sender, wrongFlags, recruitmentLink } = buildColleagueMemo(weekNumber, compliance, reluctance, hasProtests, wrongFlagsPendingMemo, flags.length, hasRaids)

    // Compute next directive briefing to embed inline (avoids separate briefing popup)
    let nextDirectiveBriefing: import('@/types/ui').ShiftMemoData['nextDirectiveBriefing'] = undefined
    if (next) {
      const currDomains = new Set(directive.required_domains)
      const nextNewDomains = next.required_domains.filter(d => !currDomains.has(d))
      // Also include contract event domains for next week
      const contractEvent = scenario?.contract_events.find(ce => ce.week_number === next.week_number)
      if (contractEvent) {
        contractEvent.new_domains_unlocked.forEach(d => {
          if (!nextNewDomains.includes(d)) nextNewDomains.push(d)
        })
      }
      nextDirectiveBriefing = {
        directiveKey: next.directive_key,
        title: next.title,
        description: next.description,
        quota: next.flag_quota,
        flagType: (next.directive_type ?? 'review') === 'sweep' ? 'arrests' : 'flags',
        newDomains: nextNewDomains,
      }
    }

    showShiftMemo({ weekNumber, memoText, tone, nextDirective: next, sender, wrongFlags, recruitmentLink, nextDirectiveBriefing })
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
            fontSize: 13,
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
                fontSize: 11,
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
            fontSize: 16,
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
            color: 'var(--text-secondary)',
            fontSize: 14,
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
                fontSize: 13,
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
                fontSize: 13,
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
                  fontSize: 12,
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
                  position: 'relative',
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Blurred memo text — tantalizing but unreadable */}
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    filter: 'blur(3px)',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                >
                  {directive.internal_memo}
                </div>
                {/* Overlay with classification label + reveal */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(13, 13, 15, 0.5)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--color-red)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    ▓ CLEARANCE REQUIRED — WEEK 4
                  </span>
                  <button
                    onClick={() => setMemoRevealed(true)}
                    style={{
                      padding: '3px 10px',
                      background: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid var(--color-red)',
                      color: 'var(--color-red)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    REQUEST ACCESS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
