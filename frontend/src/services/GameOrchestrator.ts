/**
 * GameOrchestrator — coordinates full game initialization.
 * Loads content, generates citizens, injects scenario NPCs, and initialises stores.
 */
import { faker } from '@faker-js/faker'
import { useContentStore } from '@/stores/contentStore'
import { useCitizenStore } from '@/stores/citizenStore'
import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { generateSkeleton } from './CitizenGenerator'
import { computeRiskForAll } from './RiskComputeWorker'
import type { CitizenSkeleton } from '@/types/citizen'

const BASE_SEED = 42000
const JESSICA_SLOT = 4           // index in skeletons array where jessica is injected

/**
 * Initialise the entire game:
 * 1. Load all JSON content for the given country
 * 2. Generate 50 citizen skeletons (deterministic)
 * 3. Inject Jessica Martinez at slot 4
 * 4. Populate citizen store
 * 5. Kick off game store with operator code + first directive
 * 6. Expose __stores on window in DEV
 */
export async function initializeGame(countryKey: string, operatorCode: string): Promise<void> {
  // ── 1. Load content ───────────────────────────────────────────────────────
  await useContentStore.getState().loadContent(countryKey)

  const { scenario, country } = useContentStore.getState()
  if (!scenario) throw new Error('GameOrchestrator: scenario failed to load')
  if (!country) throw new Error('GameOrchestrator: country failed to load')

  // ── 2. Generate 50 skeletons ──────────────────────────────────────────────
  const skeletons: CitizenSkeleton[] = Array.from({ length: 50 }, (_, index) =>
    generateSkeleton(BASE_SEED, index, country),
  )

  // ── 3. Inject scenario NPCs ───────────────────────────────────────────────
  // jessica_martinez goes at JESSICA_SLOT; all others are appended after the 50 base skeletons.
  for (let i = 0; i < scenario.special_npcs.length; i++) {
    const npc = scenario.special_npcs[i]!
    const npcSeed = BASE_SEED + (4000 + i) * 1000
    faker.seed(npcSeed)
    const npcSkeleton: CitizenSkeleton = {
      id: faker.string.uuid(),
      first_name: npc.first_name,
      last_name: npc.last_name,
      date_of_birth: faker.date
        .birthdate({ min: 25, max: 55, mode: 'age' })
        .toISOString()
        .split('T')[0]!,
      ssn: `${Math.floor(faker.number.float({ min: 100, max: 999 }))}-${Math.floor(faker.number.float({ min: 10, max: 99 }))}-${Math.floor(faker.number.float({ min: 1000, max: 9999 }))}`,
      street_address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip_code: faker.location.zipCode(),
      role: npc.role as CitizenSkeleton['role'],
      sprite_key: npc.sprite_key,
      map_x: npc.map_x,
      map_y: npc.map_y,
      is_scenario_npc: true,
      scenario_key: npc.npc_key,
      appears_at_week: npc.appears_at_week ?? null,
      risk_score_cache: null,
      risk_score_updated_at: null,
      generation_seed: npcSeed,
    }
    if (npc.npc_key === 'jessica_martinez') {
      skeletons[JESSICA_SLOT] = npcSkeleton
    } else {
      skeletons.push(npcSkeleton)
    }
  }

  // ── 4. Populate citizen store ─────────────────────────────────────────────
  useCitizenStore.getState().initializePopulation(skeletons)

  // ── 5. Initialise game store ──────────────────────────────────────────────
  const firstDirective = scenario.directives.find(d => d.week_number === 1)
  if (!firstDirective) throw new Error('GameOrchestrator: no week-1 directive found in scenario')
  useGameStore.getState().initializeGame(operatorCode, firstDirective)

  // ── 5b. Background risk computation (non-blocking) ────────────────────────
  const { dataBanks: dbs, inferenceRules: rules } = useContentStore.getState()
  if (dbs && rules.length > 0) {
    const initialDomains = new Set(firstDirective.required_domains)
    computeRiskForAll(
      skeletons,
      dbs,
      country,
      rules,
      initialDomains,
      (id, score) => useCitizenStore.getState().updateSkeletonCache(id, score),
    ).catch(err => console.warn('[RiskComputeWorker] Background error:', err))
  }

  // ── 5c. Re-compute risk scores whenever new domains unlock ────────────────
  //
  // Contract events (weeks 3–4) call unlockDomains(), growing the set.
  // We subscribe to the store and re-run the full batch whenever the domain
  // count increases, so the queue reflects the new data without requiring
  // the player to click each citizen individually.
  const unsubscribeDomainWatch = useContentStore.subscribe(
    (state, prevState) => {
      if (state.unlockedDomains.length <= prevState.unlockedDomains.length) return

      const { dataBanks: currentDbs, inferenceRules: currentRules, country: currentCountry } = state
      if (!currentDbs || !currentCountry || currentRules.length === 0) return

      const currentSkeletons = useCitizenStore.getState().skeletons
      // Clear stale scores so the worker recomputes all of them with the new domains
      useCitizenStore.getState().clearAllRiskScoreCaches()

      computeRiskForAll(
        currentSkeletons,
        currentDbs,
        currentCountry,
        currentRules,
        new Set(state.unlockedDomains),
        (id, score) => useCitizenStore.getState().updateSkeletonCache(id, score),
      ).catch(err => console.warn('[RiskComputeWorker] Domain-unlock recompute error:', err))
    },
  )

  // Persist the unsubscribe function on window so it can be cleaned up on reset
  ;(window as unknown as Record<string, unknown>).__unsubDomainWatch = unsubscribeDomainWatch

  // ── 6. Expose stores in DEV for Playwright tests ──────────────────────────
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__stores = {
      game: useGameStore.getState,
      citizens: useCitizenStore.getState,
      metrics: useMetricsStore.getState,
      ui: useUIStore.getState,
      content: useContentStore.getState,
    }
  }
}

