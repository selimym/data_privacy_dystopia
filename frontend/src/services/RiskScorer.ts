/**
 * RiskScorer — calculates a 0-100 risk score from a citizen profile.
 * Pure function: no side effects, no store imports.
 */
import type { CitizenProfile, RiskAssessment, RiskFactor, RiskLevel } from '@/types/citizen'
import type { InferenceResult } from '@/types/citizen'
import type { DomainKey } from '@/types/game'

// Risk factor weights — higher = more "suspicious" to the system
// These mirror the old risk_factors.json values
const RISK_FACTOR_WEIGHTS: Record<string, number> = {
  // Judicial
  has_felony: 40,
  has_violent_offense: 35,
  has_drug_offense: 25,
  protest_related_charge: 30,

  // Financial
  delinquent_debt: 15,
  suspicious_transactions: 20,
  cash_heavy_transactions: 18,
  debt_to_income_high: 12,

  // Health (sensitive)
  mental_health_treatment: 20,
  substance_abuse_treatment: 25,
  hiv_positive: 15,

  // Location
  flagged_location_visits: 30,
  high_mobility: 10,

  // Social
  flagged_group_membership: 35,
  flagged_social_connections: 25,
  concerning_posts: 20,
  encrypted_communication: 15,

  // Inference-based
  inference_scariness_3: 15,
  inference_scariness_4: 25,
  inference_scariness_5: 35,
}

export function calculateRiskScore(
  profile: CitizenProfile,
  inferences: InferenceResult[],
  unlockedDomains: Set<DomainKey>,
): RiskAssessment {
  const factors: RiskFactor[] = []
  let totalScore = 0

  function addFactor(
    key: string,
    label: string,
    present: boolean,
    sourceDomains: DomainKey[],
  ) {
    const weight = RISK_FACTOR_WEIGHTS[key] ?? 10
    factors.push({ key, label, weight, present, source_domains: sourceDomains })
    if (present) totalScore += weight
  }

  // Judicial factors
  if (unlockedDomains.has('judicial') && profile.judicial) {
    addFactor('has_felony', 'Felony conviction on record', profile.judicial.has_felony, ['judicial'])
    addFactor('has_violent_offense', 'Violent offense history', profile.judicial.has_violent_offense, ['judicial'])
    addFactor('has_drug_offense', 'Drug-related offense', profile.judicial.has_drug_offense, ['judicial'])
    const hasProtestCharge = profile.judicial.cases.some(c =>
      c.charge.toLowerCase().includes('assembly') ||
      c.charge.toLowerCase().includes('obstruction') ||
      c.charge.toLowerCase().includes('disperse'),
    )
    addFactor('protest_related_charge', 'Protest/civil disobedience charge', hasProtestCharge, ['judicial'])
  }

  // Financial factors
  if (unlockedDomains.has('finance') && profile.finance) {
    const delinquentCount = profile.finance.debts.filter(d => d.delinquent).length
    addFactor('delinquent_debt', `${delinquentCount} delinquent debt account(s)`, delinquentCount > 0, ['finance'])
    const suspiciousTxCount = profile.finance.transactions.filter(t => t.is_suspicious).length
    addFactor('suspicious_transactions', `${suspiciousTxCount} suspicious transaction(s)`, suspiciousTxCount >= 2, ['finance'])
    const cashCount = profile.finance.transactions.filter(t => t.category === 'other' && t.amount > 200).length
    addFactor('cash_heavy_transactions', 'High cash transaction pattern', cashCount >= 5, ['finance'])
  }

  // Health factors
  if (unlockedDomains.has('health') && profile.health) {
    const hasMentalHealth = profile.health.sensitive_conditions.some(c =>
      ['Depression', 'Anxiety Disorder', 'Bipolar Disorder', 'PTSD', 'Schizophrenia', 'OCD'].includes(c),
    )
    addFactor('mental_health_treatment', 'Mental health treatment history', hasMentalHealth, ['health'])
    const hasSubstance = profile.health.sensitive_conditions.includes('Substance Use Disorder')
    addFactor('substance_abuse_treatment', 'Substance abuse treatment', hasSubstance, ['health'])
    const hasHIV = profile.health.sensitive_conditions.includes('HIV')
    addFactor('hiv_positive', 'HIV positive', hasHIV, ['health'])
  }

  // Location factors
  if (unlockedDomains.has('location') && profile.location) {
    addFactor(
      'flagged_location_visits',
      `Visited ${profile.location.flagged_locations.length} flagged location(s)`,
      profile.location.flagged_locations.length > 0,
      ['location'],
    )
  }

  // Social factors
  if (unlockedDomains.has('social') && profile.social) {
    addFactor(
      'flagged_group_membership',
      `Member of ${profile.social.flagged_group_memberships.length} flagged group(s)`,
      profile.social.flagged_group_memberships.length > 0,
      ['social'],
    )
    const flaggedConnections = profile.social.connections.filter(c => c.is_flagged).length
    addFactor('flagged_social_connections', `${flaggedConnections} flagged connection(s)`, flaggedConnections >= 2, ['social'])
    const concerningPosts = profile.social.posts.filter(p => p.is_concerning).length
    addFactor('concerning_posts', `${concerningPosts} concerning post(s)`, concerningPosts >= 3, ['social'])
  }

  // Message factors
  if (unlockedDomains.has('messages') && profile.messages) {
    const encryptedCount = profile.messages.filter(m => m.is_encrypted).length
    addFactor('encrypted_communication', `Uses encrypted messaging (${encryptedCount} messages)`, encryptedCount >= 2, ['messages'])
  }

  // Inference-based risk
  const inferencesByLevel = { 3: 0, 4: 0, 5: 0 }
  for (const inf of inferences) {
    if (inf.scariness_level >= 3) {
      inferencesByLevel[inf.scariness_level as 3 | 4 | 5] = (inferencesByLevel[inf.scariness_level as 3 | 4 | 5] ?? 0) + 1
    }
  }
  addFactor('inference_scariness_3', 'Serious data fusion inferences', inferencesByLevel[3] > 0, [])
  addFactor('inference_scariness_4', 'Disturbing data fusion inferences', inferencesByLevel[4] > 0, [])
  addFactor('inference_scariness_5', 'Severe/dystopian data fusion inferences', inferencesByLevel[5] > 0, [])

  const score = Math.min(100, totalScore)
  const level = scoreToLevel(score)

  return {
    score,
    level,
    factors,
    generated_at: new Date().toISOString(),
  }
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return 'severe'
  if (score >= 60) return 'high'
  if (score >= 40) return 'elevated'
  if (score >= 20) return 'moderate'
  return 'low'
}
