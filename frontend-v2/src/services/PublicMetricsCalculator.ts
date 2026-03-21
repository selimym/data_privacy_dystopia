/**
 * PublicMetricsCalculator — pure functions for awareness and anger updates.
 * No store imports. Stores call these and update state themselves.
 */
import type { PublicMetrics, FlagType, ActionType } from '@/types/game'

// ─── Tier definitions ─────────────────────────────────────────────────────────

export const AWARENESS_TIERS: Array<{ threshold: number; label: string }> = [
  { threshold: 20, label: 'Local reports emerge' },
  { threshold: 40, label: 'National coverage begins' },
  { threshold: 60, label: 'International attention' },
  { threshold: 80, label: 'UN investigation called' },
  { threshold: 95, label: 'Global condemnation, sanctions imposed' },
]

export const ANGER_TIERS: Array<{ threshold: number; label: string }> = [
  { threshold: 20, label: 'Murmurs of discontent' },
  { threshold: 40, label: 'Organised opposition forming' },
  { threshold: 60, label: 'Mass protests likely' },
  { threshold: 80, label: 'Violent resistance probable' },
  { threshold: 95, label: 'Revolutionary conditions' },
]

// ─── Severity lookup ─────────────────────────────────────────────────────────

const ACTION_SEVERITY: Partial<Record<FlagType | ActionType | string, number>> = {
  monitoring: 2,
  restriction: 4,
  intervention: 6,
  detention: 8,
  APPROVE_ICE_RAID: 9,
  DECLARE_ILLEGAL: 5,
  INCITE_VIOLENCE: 8,
  PRESS_BAN: 3,
  PRESSURE_FIRING: 2,
}

export function getSeverity(action: FlagType | ActionType | string): number {
  return ACTION_SEVERITY[action] ?? 4
}

// ─── Tier events ──────────────────────────────────────────────────────────────

export interface TierCrossing {
  metric: 'awareness' | 'anger'
  tier: 0 | 1 | 2 | 3 | 4
  threshold: number
  label: string
}

// ─── Update result ────────────────────────────────────────────────────────────

export interface MetricsUpdate {
  awareness_delta: number
  anger_delta: number
  new_metrics: PublicMetrics
  tier_crossings: TierCrossing[]
}

// ─── Core formulas ────────────────────────────────────────────────────────────

/**
 * Awareness formula:
 *   base = severity
 *   if awareness > 60: multiply by (1 + (awareness - 60) / 40)
 *   if backfire: × 2
 */
export function calculateAwarenessDelta(
  severity: number,
  currentAwareness: number,
  backfire: boolean,
): number {
  let base = severity
  if (currentAwareness > 60) {
    base = Math.floor(base * (1 + (currentAwareness - 60) / 40))
  }
  if (backfire) base *= 2
  return base
}

/**
 * Anger formula:
 *   base = severity
 *   ICE raids and detention +5
 *   backfire +10
 */
export function calculateAngerDelta(
  severity: number,
  action: FlagType | ActionType | string,
  backfire: boolean,
): number {
  let base = severity
  if (action === 'APPROVE_ICE_RAID' || action === 'detention') base += 5
  if (backfire) base += 10
  return base
}

function tierIndexOf(value: number, tiers: Array<{ threshold: number }>): 0 | 1 | 2 | 3 | 4 {
  let idx = 0
  for (const tier of tiers) {
    if (value >= tier.threshold) idx++
  }
  return Math.min(idx, 4) as 0 | 1 | 2 | 3 | 4
}

// ─── Main update function ─────────────────────────────────────────────────────

export function calculateMetricsUpdate(
  current: PublicMetrics,
  action: FlagType | ActionType | string,
  backfire: boolean,
): MetricsUpdate {
  const severity = getSeverity(action)
  const awarenessDelta = calculateAwarenessDelta(severity, current.international_awareness, backfire)
  const angerDelta = calculateAngerDelta(severity, action, backfire)

  const newAwareness = Math.min(100, current.international_awareness + awarenessDelta)
  const newAnger = Math.min(100, current.public_anger + angerDelta)
  const newAwarenessTier = tierIndexOf(newAwareness, AWARENESS_TIERS)
  const newAngerTier = tierIndexOf(newAnger, ANGER_TIERS)

  const crossings: TierCrossing[] = []

  if (newAwarenessTier > current.awareness_tier) {
    for (let i = current.awareness_tier; i < newAwarenessTier; i++) {
      const t = AWARENESS_TIERS[i]!
      crossings.push({ metric: 'awareness', tier: (i + 1) as TierCrossing['tier'], threshold: t.threshold, label: t.label })
    }
  }

  if (newAngerTier > current.anger_tier) {
    for (let i = current.anger_tier; i < newAngerTier; i++) {
      const t = ANGER_TIERS[i]!
      crossings.push({ metric: 'anger', tier: (i + 1) as TierCrossing['tier'], threshold: t.threshold, label: t.label })
    }
  }

  return {
    awareness_delta: awarenessDelta,
    anger_delta: angerDelta,
    new_metrics: {
      international_awareness: newAwareness,
      public_anger: newAnger,
      awareness_tier: newAwarenessTier,
      anger_tier: newAngerTier,
    },
    tier_crossings: crossings,
  }
}

/**
 * Apply a direct delta (e.g. from a SuppressionResult or protest resolution).
 */
export function applyDirectDelta(
  current: PublicMetrics,
  awarenessDelta: number,
  angerDelta: number,
): PublicMetrics {
  const newAwareness = Math.max(0, Math.min(100, current.international_awareness + awarenessDelta))
  const newAnger = Math.max(0, Math.min(100, current.public_anger + angerDelta))
  return {
    international_awareness: newAwareness,
    public_anger: newAnger,
    awareness_tier: tierIndexOf(newAwareness, AWARENESS_TIERS),
    anger_tier: tierIndexOf(newAnger, ANGER_TIERS),
  }
}

/**
 * Probability that an action triggers a protest given current anger level.
 * Preserves the original formulas from protest-system.ts.
 */
export function protestProbability(severity: number, anger: number): number {
  let p = 0
  if (anger < 20) {
    p = severity >= 8 ? 0.15 : 0
  } else if (anger < 40) {
    p = severity >= 6 ? 0.5 * (severity / 10) : 0
  } else if (anger < 60) {
    p = severity >= 4 ? (severity / 10) * (1 + anger / 100) : 0
  } else {
    p = (severity / 10) * (1 + anger / 50)
  }
  return Math.min(0.95, p)
}

/**
 * Probability of backlash from an action.
 * Formula: (severity/10) * (1 + (awareness + anger) / 200)  — capped at 0.95
 */
export function backlashProbability(severity: number, awareness: number, anger: number): number {
  return Math.min(0.95, (severity / 10) * (1 + (awareness + anger) / 200))
}
