/**
 * ProtestManager — protest trigger, size calculation, and suppression resolution.
 * All formulas preserved from original codebase.
 */
import type { PublicMetrics, ProtestEvent, SuppressionResult, FlagType, ActionType } from '@/types/game'

const NEIGHBORHOODS = [
  'Downtown District', 'Riverside Quarter', 'East Side',
  'Northgate', 'Westbrook', 'Harbor Front', 'University District',
  'Market Street', 'Central Park Area', 'South Side',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Returns a protest event or null based on action severity and public anger */
export function calculateProtestTrigger(
  triggeringAction: FlagType | ActionType,
  metrics: PublicMetrics,
  severity: number,            // 1-10
): ProtestEvent | null {
  const { public_anger: anger } = metrics
  let probability = 0

  if (anger < 20) {
    probability = severity >= 8 ? 0.15 : 0
  } else if (anger < 40) {
    probability = severity >= 6 ? 0.5 * (severity / 10) : 0
  } else if (anger < 60) {
    probability = severity >= 4 ? (severity / 10) * (1 + anger / 100) : 0
  } else {
    probability = (severity / 10) * (1 + anger / 50)
  }

  probability = Math.min(probability, 0.95)
  if (Math.random() > probability) return null

  const size = calculateProtestSize(anger, severity)

  return {
    id: crypto.randomUUID(),
    size,
    neighborhood: pick(NEIGHBORHOODS),
    status: 'forming',
    has_inciting_agent: Math.random() < 0.3,
    triggered_by_action: triggeringAction,
    awareness_impact: Math.min(5, 1 + size / 100),
    anger_impact: Math.min(3, 1 + size / 200),
    started_at: new Date().toISOString(),
    acknowledged: false,
  }
}

/** Exact formula from original codebase */
export function calculateProtestSize(anger: number, severity: number): number {
  const base = 50 + anger * 2 + severity * 30
  const variance = 0.7 + Math.random() * 0.6   // 0.7 to 1.3
  return Math.round(Math.max(50, Math.min(5000, base * variance)))
}

/** 60/40 suppression odds for INCITE_VIOLENCE, guaranteed for DECLARE_ILLEGAL */
export function resolveSuppressionAttempt(
  method: 'DECLARE_ILLEGAL' | 'INCITE_VIOLENCE',
  protest: ProtestEvent,
  _metrics: PublicMetrics,
): SuppressionResult {
  if (method === 'DECLARE_ILLEGAL') {
    const arrests = 5 + Math.floor(Math.random() * 11)   // 5-15
    return {
      success: true,
      method,
      backfire: false,
      arrests,
      casualties: 0,
      awareness_delta: 8,
      anger_delta: 6,
      narrative: `Authorities declared the assembly of ${protest.size} unlawful. ${arrests} participants arrested under Emergency Assembly Provision § 14.`,
    }
  }

  // INCITE_VIOLENCE: 60% success, 40% catastrophic exposure
  const success = Math.random() < 0.6

  if (success) {
    const casualties = 3 + Math.floor(Math.random() * 8)   // 3-10
    const arrests = 20 + Math.floor(Math.random() * 31)    // 20-50
    return {
      success: true,
      method,
      backfire: false,
      casualties,
      arrests,
      awareness_delta: 5,
      anger_delta: 3,
      narrative: `Agent successfully incited violence. Protesters blamed. ${casualties} casualties, ${arrests} arrested. Coverage frames protesters as aggressors.`,
    }
  } else {
    const casualties = 5 + Math.floor(Math.random() * 11)  // 5-15
    const arrests = 10 + Math.floor(Math.random() * 21)    // 10-30
    return {
      success: false,
      method,
      backfire: true,
      casualties,
      arrests,
      awareness_delta: 25,
      anger_delta: 30,
      narrative: `CATASTROPHE: Agent's identity exposed. State's role in inciting violence confirmed. ${casualties} casualties attributed to authorities. International condemnation. Awareness crisis.`,
    }
  }
}

/** Severity score for a flag type (used in protest trigger calculations) */
export const FLAG_TYPE_SEVERITY: Record<string, number> = {
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
