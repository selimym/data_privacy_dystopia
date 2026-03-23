/**
 * RiskComputeWorker — background batch risk score computation.
 * Processes all citizen skeletons in batches, yielding to the event loop
 * between batches so the UI stays responsive.
 */
import type { CitizenSkeleton } from '@/types/citizen'
import type { DataBanks, CountryProfile, InferenceRule } from '@/types/content'
import type { DomainKey } from '@/types/game'
import { generateFullProfile } from './CitizenGenerator'
import { calculateRiskScore } from './RiskScorer'
import { InferenceEngine } from './InferenceEngine'

const BATCH_SIZE = 5

export async function computeRiskForAll(
  skeletons: CitizenSkeleton[],
  dataBanks: DataBanks,
  country: CountryProfile,
  inferenceRules: InferenceRule[],
  unlockedDomains: Set<DomainKey>,
  onUpdate: (id: string, score: number) => void,
): Promise<void> {
  const engine = new InferenceEngine(inferenceRules)

  for (let i = 0; i < skeletons.length; i += BATCH_SIZE) {
    const batch = skeletons.slice(i, i + BATCH_SIZE)

    for (const skeleton of batch) {
      // Skip if already computed
      if (skeleton.risk_score_cache !== null) continue

      try {
        const profile = await generateFullProfile(skeleton, dataBanks, country)
        const inferences = engine.evaluate(profile, unlockedDomains, country)
        const assessment = calculateRiskScore(profile, inferences, unlockedDomains)
        onUpdate(skeleton.id, assessment.score)
      } catch {
        // Skip citizens that fail to generate — non-fatal
      }
    }

    // Yield to event loop between batches
    await new Promise<void>(r => setTimeout(r, 0))
  }
}
