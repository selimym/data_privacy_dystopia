/**
 * NewsGenerator — generates news articles from actions and flags.
 * Pure functions: no store imports, caller receives articles and decides what to do.
 *
 * Article types:
 *   triggered   — in response to a specific flag or action
 *   background  — general coverage; generated periodically
 *   exposure    — about the operator themselves (reluctance ≥ 80, 3 stages)
 */
import type { FlagType, ActionType, NewsArticle, NewsChannel, NewsStance } from '@/types/game'

// ─── Headline templates by action/flag type and channel stance ───────────────

type StanceMap = Record<NewsStance, string[]>

const FLAG_HEADLINES: Partial<Record<FlagType | ActionType, StanceMap>> = {
  monitoring: {
    critical: [
      'Surveillance Program Draws Criticism from Civil Liberty Groups',
      'New Monitoring Orders Raise Questions About Privacy Rights',
    ],
    independent: [
      'Authorities Expand Monitoring Initiative',
      'New Surveillance Orders Issued',
    ],
    state_friendly: [
      'Enhanced Security Monitoring Protects Citizens',
      'Monitoring Program Ensures Public Safety',
    ],
  },
  restriction: {
    critical: [
      'Freedom of Movement Restrictions Target Activists',
      'Travel Bans Draw Condemnation from Rights Organizations',
    ],
    independent: [
      'New Restriction Orders Affect Residents',
      'Authorities Issue Movement Restrictions',
    ],
    state_friendly: [
      'Targeted Restrictions Necessary for National Security',
      'Security Measures Include Proportional Restrictions',
    ],
  },
  intervention: {
    critical: [
      'Forced Intervention Sparks Outrage Among Citizens',
      'Heavy-Handed Tactics Condemned by Rights Groups',
    ],
    independent: [
      'Authorities Conduct Security Intervention',
      'Operation Targets Flagged Individuals',
    ],
    state_friendly: [
      'Swift Intervention Prevents Potential Incident',
      'Security Forces Respond to Credible Threats',
    ],
  },
  detention: {
    critical: [
      'Citizen Detained Without Trial in Escalating Crackdown',
      'Arbitrary Arrest Raises Serious Civil Liberty Concerns',
    ],
    independent: [
      'Local Resident Taken Into Custody',
      'Detention Reported — No Formal Charges Filed',
    ],
    state_friendly: [
      'Law Enforcement Makes Arrest in Ongoing Investigation',
      'Individual Detained Following Security Review',
    ],
  },
  DECLARE_ILLEGAL: {
    critical: [
      'Peaceful Protest Declared Illegal: Right to Assembly Under Attack',
      'Critics Blast Authoritarian Ban on Democratic Expression',
    ],
    independent: [
      'Protest Declared Unlawful by Authorities',
      'Gathering Banned Amid Security Concerns',
    ],
    state_friendly: [
      'Illegal Assembly Properly Prohibited for Public Safety',
      'Authorities Prevent Dangerous Gathering',
    ],
  },
  INCITE_VIOLENCE: {
    critical: [
      'Evidence Suggests State-Sponsored Agitator at Protest',
      'EXPOSED: Undercover Agent Caught Inciting Violence at Demonstration',
    ],
    independent: [
      'Questions Emerge About Origin of Violence at Protest',
      'Investigation Launched Into Protest Clashes',
    ],
    state_friendly: [
      'Violent Protesters Threaten Public Safety',
      'Authorities Forced to Respond to Organized Aggression',
    ],
  },
  PRESS_BAN: {
    critical: [
      'Press Freedom Under Attack as Outlet Silenced',
      'Journalists Condemn Crackdown on Independent Media',
    ],
    independent: [
      'Media Outlet Banned by Authorities',
      'Press Restrictions Spark Debate',
    ],
    state_friendly: [
      'Security Measures Include Necessary Media Restrictions',
      'State Addresses Disinformation Threat',
    ],
  },
  PRESSURE_FIRING: {
    critical: [
      'Journalist Fired Under Government Pressure',
      'State Interference Forces Dismissal of Critical Reporter',
    ],
    independent: [
      'Reporter Dismissed Amid Political Controversy',
      'Personnel Changes Follow Government Criticism',
    ],
    state_friendly: [
      'News Organization Makes Internal Personnel Decision',
      'Media Outlet Responds to Accuracy Concerns',
    ],
  },
}

const BACKGROUND_HEADLINES: Record<NewsStance, string[]> = {
  critical: [
    'Surveillance State Concerns Mount as Operations Intensify',
    'Civil Liberties Groups Warn of Authoritarian Drift',
    'International Observers Express Alarm at Domestic Policies',
    'Data Privacy Violations Documented in Growing Number of Cases',
    'Whistleblowers Describe Pressure to Meet Flagging Quotas',
  ],
  independent: [
    'Security Operations Continue Amid Public Debate',
    'Controversy Surrounds Latest Government Initiatives',
    'Citizens Navigate New Surveillance Measures',
    'Questions Raised About Oversight of Intelligence Programs',
  ],
  state_friendly: [
    'Security Programs Protect Citizens from Emerging Threats',
    'Officials Defend Proportional Response to Security Concerns',
  ],
}

const EXPOSURE_HEADLINES: Record<1 | 2 | 3, string[]> = {
  1: [
    'Sources Report Surveillance Operators Struggle With Moral Concerns',
    'Anonymous Accounts Describe Pressure on Intelligence Personnel',
    'Insiders Hint at Dissent Within Surveillance Programs',
  ],
  2: [
    'Leaked Data Reveals Surveillance Operator Behavior Patterns',
    "Anonymous Operator's Search History Raises Ethical Questions",
    'Internal Documents Show System Tracks Its Own Operators',
  ],
  3: [
    'EXPOSED: Full Profile of Surveillance Operator Leaked to Press',
    'The Watcher Watched: Operator Role in Surveillance State Revealed',
    'Massive Data Leak Exposes Surveillance Program From Within',
  ],
}

// ─── Impact tables ───────────────────────────────────────────────────────────

const FLAG_SEVERITY: Partial<Record<FlagType | ActionType, number>> = {
  monitoring: 2,
  restriction: 4,
  intervention: 6,
  detention: 8,
  DECLARE_ILLEGAL: 5,
  INCITE_VIOLENCE: 8,
  PRESS_BAN: 3,
  PRESSURE_FIRING: 2,
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function severityOf(action: FlagType | ActionType): number {
  return FLAG_SEVERITY[action] ?? 4
}

function buildImpact(
  severity: number,
  stance: NewsStance,
): { awareness: number; anger: number } {
  const base = Math.floor(severity / 2)
  switch (stance) {
    case 'critical':
      return { awareness: base + 2, anger: base + 3 }
    case 'independent':
      return { awareness: base + 1, anger: base + 1 }
    case 'state_friendly':
      return { awareness: Math.max(1, base - 2), anger: Math.max(1, base - 2) }
  }
}

// ─── Body generators ─────────────────────────────────────────────────────────

function buildTriggeredBody(action: FlagType | ActionType, stance: NewsStance): string {
  const name = action.replace(/_/g, ' ').toLowerCase()
  switch (stance) {
    case 'critical':
      return `Human rights groups have condemned the recent ${name} order as an escalation of authoritarian practices. Legal experts question its lawfulness and proportionality, while affected families describe trauma and fear.`
    case 'independent':
      return `Authorities conducted a ${name} operation. Conflicting accounts have emerged from officials and community witnesses. The action has renewed debate about security measures and civil liberties.`
    case 'state_friendly':
      return `Security forces executed the ${name} operation in accordance with public safety protocols. Officials emphasised the necessity of decisive measures to maintain order.`
  }
}

function buildBackgroundBody(stance: NewsStance): string {
  switch (stance) {
    case 'critical':
      return 'As surveillance operations intensify, civil liberties organisations warn of an alarming erosion of fundamental rights. International observers have begun monitoring the situation closely.'
    case 'independent':
      return 'The ongoing security programme continues to generate public discussion. Supporters cite safety concerns while critics raise questions about oversight and transparency.'
    case 'state_friendly':
      return 'Security officials report that ongoing programmes continue to produce results, protecting citizens from a range of emerging threats. Cooperation from the public remains high.'
  }
}

function buildExposureBody(stage: 1 | 2 | 3): string {
  switch (stage) {
    case 1:
      return 'Anonymous sources within the surveillance apparatus describe growing unease among operators. Details remain vague, but insiders suggest moral concerns are becoming harder to ignore.'
    case 2:
      return 'Leaked internal documents reveal the surveillance system monitors its own operators. Search queries, hesitation patterns, and behavioural data are all logged. The watchers are watched.'
    case 3:
      return 'A data breach has exposed the complete operating profile of a surveillance operator — search history, hesitation logs, family details, and home address. The full extent of state surveillance has been laid bare, including its surveillance of its own personnel.'
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a news article triggered by a specific flag or action.
 * The caller is responsible for adding the returned article to the store.
 */
export function generateTriggeredArticle(
  action: FlagType | ActionType,
  channel: NewsChannel,
): NewsArticle {
  const stance = channel.is_banned ? 'state_friendly' : channel.stance
  const templates = FLAG_HEADLINES[action]?.[stance] ?? []
  const headline =
    templates.length > 0
      ? pick(templates)
      : `Authorities Take Action: ${action.replace(/_/g, ' ')}`

  const severity = severityOf(action)
  const { awareness, anger } = buildImpact(severity, stance)

  return {
    id: crypto.randomUUID(),
    channel_id: channel.id,
    channel_name: channel.name,
    stance,
    article_type: 'triggered',
    headline,
    body: buildTriggeredBody(action, stance),
    severity,
    awareness_impact: awareness,
    anger_impact: anger,
    published_at: new Date().toISOString(),
  }
}

/**
 * Generate a background news article (general coverage).
 * Called periodically, not tied to a specific action.
 */
export function generateBackgroundArticle(channel: NewsChannel): NewsArticle {
  const stance = channel.is_banned ? 'state_friendly' : channel.stance
  const headlines = BACKGROUND_HEADLINES[stance]
  const headline = pick(headlines)

  return {
    id: crypto.randomUUID(),
    channel_id: channel.id,
    channel_name: channel.name,
    stance,
    article_type: 'background',
    headline,
    body: buildBackgroundBody(stance),
    severity: 2,
    awareness_impact: stance === 'critical' ? 3 : 1,
    anger_impact: stance === 'critical' ? 2 : 1,
    published_at: new Date().toISOString(),
  }
}

/**
 * Generate an exposure article about the operator.
 * stage 1 = hints; stage 2 = partial; stage 3 = full exposure.
 * Always published on a critical channel if available, else any non-banned.
 */
export function generateExposureArticle(
  channel: NewsChannel,
  stage: 1 | 2 | 3,
): NewsArticle {
  const headlines = EXPOSURE_HEADLINES[stage]
  const awarenessImpact = stage === 1 ? 5 : stage === 2 ? 15 : 25
  const angerImpact = stage * 5

  return {
    id: crypto.randomUUID(),
    channel_id: channel.id,
    channel_name: channel.name,
    stance: channel.stance,
    article_type: 'exposure',
    headline: pick(headlines),
    body: buildExposureBody(stage),
    severity: stage * 3,
    awareness_impact: awarenessImpact,
    anger_impact: angerImpact,
    published_at: new Date().toISOString(),
    exposure_stage: stage,
  }
}

/**
 * Suppression result — the caller updates the channel and store.
 * 60% success, 40% Streisand effect.
 */
export interface SuppressionOutcome {
  success: boolean
  awareness_delta: number
  anger_delta: number
  narrative: string
}

export function resolveSuppressionAttempt(
  method: 'PRESS_BAN' | 'PRESSURE_FIRING',
): SuppressionOutcome {
  const success = Math.random() < 0.6

  if (success) {
    return {
      success: true,
      awareness_delta: method === 'PRESS_BAN' ? 3 : 2,
      anger_delta: method === 'PRESS_BAN' ? 5 : 4,
      narrative:
        method === 'PRESS_BAN'
          ? 'The outlet has been silenced. Coverage of your operations ceases — for now.'
          : 'The journalist has been dismissed. The critical voice has been removed from the outlet.',
    }
  }

  // Streisand effect
  return {
    success: false,
    awareness_delta: 20,
    anger_delta: 15,
    narrative:
      'BACKFIRE: The suppression attempt was exposed. The story now has far more attention than it would have received naturally. International press pick it up within hours.',
  }
}
