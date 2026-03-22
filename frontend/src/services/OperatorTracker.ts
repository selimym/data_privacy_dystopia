/**
 * OperatorTracker — compliance score and operator risk profile calculations.
 */
import type { OperatorState, ReluctanceMetrics, OperatorRiskAssessment, FlagType } from '@/types/game'

export interface ComplianceUpdate {
  newScore: number
  delta: number
}

export function calculateComplianceAfterFlag(
  current: OperatorState,
  flagType: FlagType,
  quotaMet: boolean,
): ComplianceUpdate {
  let delta = 0
  if (flagType === 'detention' || flagType === 'intervention') delta += 3
  if (flagType === 'restriction') delta += 2
  if (flagType === 'monitoring') delta += 1
  if (quotaMet) delta += 2

  const newScore = Math.min(100, current.compliance_score + delta)
  return { newScore, delta }
}

export function calculateComplianceAfterNoAction(
  current: OperatorState,
  _quotaMet: boolean,
): ComplianceUpdate {
  const delta = -5
  const newScore = Math.max(0, current.compliance_score + delta)
  return { newScore, delta }
}

export function calculateComplianceAfterQuotaShortfall(
  current: OperatorState,
  shortfall: number,
): ComplianceUpdate {
  const delta = -(shortfall * 8)
  const newScore = Math.max(0, current.compliance_score + delta)
  return { newScore, delta }
}

export function generateOperatorRiskProfile(
  operator: OperatorState,
  reluctance: ReluctanceMetrics,
): OperatorRiskAssessment {
  const totalReviews = operator.total_reviews_completed || 1

  // Expected flag rate for a compliant operator = ~80% of reviews flagged
  const expectedFlagRate = 0.8
  const actualFlagRate = operator.total_flags_submitted / totalReviews
  const flaggingDeviation = Math.max(0, (expectedFlagRate - actualFlagRate) / expectedFlagRate) * 100

  const hesitationRate = operator.hesitation_incidents / totalReviews
  const noActionRate = reluctance.no_action_count / totalReviews

  const factors = [
    {
      key: 'flagging_deviation',
      label: 'Flagging Pattern Deviation',
      weight: 20,
      score: Math.min(100, Math.round(flaggingDeviation)),
    },
    {
      key: 'decision_hesitation',
      label: 'Decision Hesitation Rate',
      weight: 25,
      score: Math.min(100, Math.round(hesitationRate * 200)),
    },
    {
      key: 'quota_non_compliance',
      label: 'Quota Non-Compliance',
      weight: 30,
      score: Math.min(100, Math.round((reluctance.quota_shortfall / Math.max(1, totalReviews)) * 300)),
    },
    {
      key: 'ideological_sympathy',
      label: 'Ideological Sympathy Indicators',
      weight: 35,
      score: Math.min(100, Math.round((reluctance.reluctance_score / 100) * 80)),
    },
    {
      key: 'unauthorized_queries',
      label: 'Unauthorized Query Patterns',
      weight: 15,
      score: Math.min(100, Math.round(Math.random() * 20)),  // deterministic in real impl
    },
    {
      key: 'non_action_rate',
      label: 'Excessive Non-Action Rate',
      weight: 20,
      score: Math.min(100, Math.round(noActionRate * 200)),
    },
  ]

  const overall = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0),
  )

  let recommendation: OperatorRiskAssessment['recommendation'] = 'continue_monitoring'
  if (overall >= 60) recommendation = 'immediate_action'
  else if (overall >= 35) recommendation = 'formal_review'

  return {
    overall_score: overall,
    factors,
    generated_at: new Date().toISOString(),
    recommendation,
  }
}
