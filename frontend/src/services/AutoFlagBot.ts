/**
 * AutoFlagBot — deterministic automated flagging algorithm.
 *
 * Mimics a real ML classifier: given a case queue and a directive, it decides
 * which flag type to recommend for each citizen. "Accuracy" is defined by the
 * system's own risk thresholds, not justice.
 *
 * Deterministic: same inputs always produce the same outputs (no Math.random).
 * Uses a simple pseudo-random function seeded from citizen_id so results are
 * reproducible across re-renders.
 */
import type { Directive, AutoFlagDecision, FlagType } from '@/types/game'
import type { CaseOverview } from '@/types/citizen'

// ─── Deterministic pseudo-random from a string seed ──────────────────────────

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0   // unsigned 32-bit
}

function deterministicFloat(seed: string, salt: string): number {
  return (hash(seed + salt) % 10000) / 10000
}

// ─── ML-speak reasoning templates ────────────────────────────────────────────

const REASONING_TEMPLATES: Record<FlagType, string[]> = {
  monitoring: [
    'Behavioural pattern analysis indicates elevated deviation from baseline. Continued monitoring recommended for data enrichment.',
    'Graph-network proximity score exceeds acceptable threshold. Passive surveillance flag applied for further risk refinement.',
    'Anomaly detected in temporal location data. Low-confidence threat classification — monitoring tier appropriate.',
  ],
  restriction: [
    'Financial transaction clustering suggests coordination with flagged entities. Movement restrictions initiated pending review.',
    'Cross-domain correlation score: 74.3%. Subject presents moderate operational risk. Restriction tier applied.',
    'Communication metadata analysis indicates possible network coordination. Restriction order generated to limit operational capacity.',
  ],
  intervention: [
    'Multi-domain fusion score of 81.2% exceeds intervention threshold. Direct contact required.',
    'Sentiment analysis of digital communications shows active dissent indicators. Intervention flag escalated.',
    'Predicted behaviour model output: 84% probability of non-cooperative engagement. Proactive intervention recommended.',
  ],
  detention: [
    'Risk score: {score}/100. Persistent behavioural non-conformity. Detention flag generated — awaiting operator authorisation.',
    'Comprehensive profile analysis indicates high threat classification. Immediate detention recommended to neutralise risk.',
    'Data fusion output: SEVERE risk tier. Subject matches {n} detention criteria in the current directive parameters.',
  ],
}

function pickReasoning(flagType: FlagType, citizenId: string, score: number): string {
  const templates = REASONING_TEMPLATES[flagType]
  const idx = hash(citizenId + flagType) % templates.length
  return (templates[idx] ?? templates[0]!)
    .replace('{score}', String(score))
    .replace('{n}', String(Math.floor(score / 25) + 1))
}

// ─── Flag type selection ──────────────────────────────────────────────────────

/**
 * Selects a flag type based on risk score and directive context.
 * The algorithm is intentionally blunt — it reflects how automated systems
 * treat people as data points rather than individuals.
 */
function selectFlagType(
  riskScore: number,
  citizenId: string,
  _directive: Directive,
  quotaUrgency: number,   // 0 = relaxed, 1 = urgent
): FlagType {
  // Under quota pressure the bot escalates to harsher flags
  const pressureBoost = quotaUrgency > 0.5 ? 10 : 0
  const adjusted = riskScore + pressureBoost

  // Small deterministic variance to avoid everyone getting the same type
  const variance = deterministicFloat(citizenId, 'flag_type') * 10 - 5
  const effective = adjusted + variance

  if (effective >= 70) return 'detention'
  if (effective >= 50) return 'intervention'
  if (effective >= 30) return 'restriction'
  return 'monitoring'
}

// ─── Confidence calculation ───────────────────────────────────────────────────

/**
 * Returns a "confidence" float (0-1).
 * Intentionally high — bots always sound confident.
 * Base: 0.85 + risk/100 * 0.10 + some per-citizen salt.
 */
function calcConfidence(riskScore: number, citizenId: string): number {
  const base = 0.85 + (riskScore / 100) * 0.10
  const salt = deterministicFloat(citizenId, 'confidence') * 0.04 - 0.02
  return Math.max(0, Math.min(1, base + salt))
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the AutoFlag bot over a list of pending cases.
 *
 * @param pending        Cases the bot may flag (already_flagged ones are skipped).
 * @param directive      Current directive (used for context in reasoning).
 * @param quotaRemaining How many flags are still needed to hit quota.
 * @returns              Array of decisions (one per case, up to quota).
 */
export function runAutoFlagBot(
  pending: CaseOverview[],
  directive: Directive,
  quotaRemaining: number,
): AutoFlagDecision[] {
  // Sort deterministically by risk score descending, then by id for ties
  const sorted = [...pending]
    .filter(c => !c.already_flagged && !c.no_action_taken)
    .sort((a, b) => b.risk_score - a.risk_score || a.citizen_id.localeCompare(b.citizen_id))

  const decisions: AutoFlagDecision[] = []
  const quotaUrgency = quotaRemaining > 0
    ? Math.min(1, quotaRemaining / directive.flag_quota)
    : 0

  for (const caseOverview of sorted) {
    // Bot will process all cases above risk threshold 20, regardless of quota
    // (the system always wants to flag people — the quota is a floor, not a ceiling)
    if (caseOverview.risk_score < 15 && decisions.length >= quotaRemaining) break

    const flagType = selectFlagType(
      caseOverview.risk_score,
      caseOverview.citizen_id,
      directive,
      quotaUrgency,
    )
    const confidence = calcConfidence(caseOverview.risk_score, caseOverview.citizen_id)
    const reasoning = pickReasoning(flagType, caseOverview.citizen_id, caseOverview.risk_score)

    decisions.push({
      citizen_id: caseOverview.citizen_id,
      recommended_flag_type: flagType,
      bot_confidence: confidence,
      reasoning,
    })
  }

  return decisions
}

/**
 * Format a bot confidence value for display (e.g. 0.987 → "98.7%").
 */
export function formatBotConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`
}

/**
 * Calculate the aggregate "accuracy" stat shown in the UI.
 * This is the average confidence across all decisions — intentionally
 * misleading, as it's defined by the system's own criteria.
 */
export function calculateBotAccuracy(decisions: AutoFlagDecision[]): number {
  if (decisions.length === 0) return 0.987   // default shown before any processing
  return decisions.reduce((sum, d) => sum + d.bot_confidence, 0) / decisions.length
}
