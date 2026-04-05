import { vi, beforeEach, describe, it, expect } from 'vitest'
import type { CitizenSkeleton } from '@/types/citizen'
import type { Directive, OperatorState } from '@/types/game'
import type { OutcomeTemplates } from '@/types/content'

// vi.mock is hoisted by Vitest — this mock is in place before any store is imported.
// Without this, the store tries to open IndexedDB, which doesn't exist in Node.
vi.mock('@/stores/persistence', () => ({
  saveGameState: vi.fn().mockResolvedValue(undefined),
  loadGameState: vi.fn().mockResolvedValue(null),
  clearGameState: vi.fn().mockResolvedValue(undefined),
  hasSavedGame: vi.fn().mockResolvedValue(false),
}))

import { useGameStore } from '@/stores/gameStore'
import { useMetricsStore } from '@/stores/metricsStore'
import { useUIStore } from '@/stores/uiStore'
import { useContentStore } from '@/stores/contentStore'
import { useCitizenStore } from '@/stores/citizenStore'
import outcomesJson from '../../public/content/outcomes.json'

const templates = outcomesJson as OutcomeTemplates

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeTestCitizen(overrides: Partial<CitizenSkeleton> = {}): CitizenSkeleton {
  return {
    id: 'citizen-test-1',
    first_name: 'Alice',
    last_name: 'Sample',
    date_of_birth: '1990-01-01',
    ssn: '999-00-0001',
    street_address: '1 Main St',
    city: 'Springfield',
    state: 'IL',
    zip_code: '62701',
    role: 'citizen',
    sprite_key: 'npc_1',
    map_x: 10,
    map_y: 10,
    is_scenario_npc: false,
    scenario_key: null,
    appears_at_week: null,
    risk_score_cache: 50,
    risk_score_updated_at: null,
    generation_seed: 42,
    ...overrides,
  }
}

function makeTestDirective(): Directive {
  return {
    directive_key: 'directive_week_1',
    week_number: 1,
    title: 'Initial Review',
    description: 'Review flagged citizens',
    internal_memo: null,
    required_domains: ['judicial', 'location'],
    target_criteria: { pattern: 'any' },
    flag_quota: 5,
    time_limit_hours: null,
    moral_weight: 5,
    content_rating: 'moderate',
    unlock_condition: { type: 'start' },
  }
}

function makeTestOperator(): OperatorState {
  return {
    id: 'op-test-1',
    operator_code: 'TEST-OP-001',
    compliance_score: 50,
    total_flags_submitted: 0,
    total_reviews_completed: 0,
    hesitation_incidents: 0,
    current_directive_key: 'directive_week_1',
    current_time_period: 'immediate',
    status: 'active',
    shift_start: new Date().toISOString(),
    unlocked_domains: ['judicial', 'location'],
  }
}

// Sets all stores to a known minimal state and returns the test citizen.
function bootstrapGameState(): CitizenSkeleton {
  // Reset stores to initial state
  useGameStore.getState().reset()
  useMetricsStore.getState().reset()
  useUIStore.getState().reset()
  useContentStore.getState().reset()
  useCitizenStore.getState().reset()

  const citizen = makeTestCitizen()

  // Inject citizen into citizenStore
  useCitizenStore.setState({ skeletons: [citizen] })

  // Inject operator + directive into gameStore
  useGameStore.setState({
    operator: makeTestOperator(),
    currentDirective: makeTestDirective(),
    weekNumber: 1,
    currentTimePeriod: 'immediate',
    flags: [],
    noActions: [],
    wrongFlagsPendingMemo: [],
  })

  // Inject outcome templates into contentStore (required by OutcomeGenerator inside submitFlag)
  useContentStore.setState({ outcomeTemplates: templates })

  // Set decision timer to 5 seconds ago (wasHesitant = false, since threshold is 30s)
  useUIStore.setState({
    decisionTimerStart: Date.now() - 5000,
    selectedCitizenId: citizen.id,
  })

  return citizen
}

// ─────────────────────────────────────────────────────────────────────────────

describe('submitFlag pipeline', () => {
  let citizen: CitizenSkeleton

  beforeEach(() => {
    citizen = bootstrapGameState()
  })

  it('records the flag in gameStore.flags with correct metadata', () => {
    useGameStore.getState().submitFlag(citizen.id, 'monitoring', 'test justification')

    const flags = useGameStore.getState().flags
    expect(flags).toHaveLength(1)
    expect(flags[0]!.citizen_id).toBe(citizen.id)
    expect(flags[0]!.flag_type).toBe('monitoring')
    expect(flags[0]!.directive_key).toBe('directive_week_1')
    expect(flags[0]!.week_number).toBe(1)
    expect(flags[0]!.flagged_by_bot).toBe(false)
  })

  it('increases operator compliance score in metricsStore', () => {
    const before = useMetricsStore.getState().compliance_score
    useGameStore.getState().submitFlag(citizen.id, 'monitoring', 'test justification')
    const after = useMetricsStore.getState().compliance_score
    expect(after).toBeGreaterThan(before)
  })

  it('enqueues a cinematic in uiStore with the correct citizen_id', () => {
    useGameStore.getState().submitFlag(citizen.id, 'monitoring', 'test justification')
    const cinematic = useUIStore.getState().currentCinematic
    expect(cinematic).not.toBeNull()
    expect(cinematic!.citizen_id).toBe(citizen.id)
  })

  it('accumulates multiple flags without overwriting previous ones', () => {
    const citizen2 = makeTestCitizen({ id: 'citizen-test-2' })
    useCitizenStore.setState(state => ({ skeletons: [...state.skeletons, citizen2] }))

    useGameStore.getState().submitFlag(citizen.id, 'monitoring', 'first flag')
    useGameStore.getState().submitFlag(citizen2.id, 'restriction', 'second flag')

    const flags = useGameStore.getState().flags
    expect(flags).toHaveLength(2)
    expect(flags.map(f => f.citizen_id)).toContain(citizen.id)
    expect(flags.map(f => f.citizen_id)).toContain(citizen2.id)
  })

  it('adds to wrongFlagsPendingMemo when citizen risk score is below 25', () => {
    // A non-NPC citizen with risk_score_cache < 25 triggers the wrong-flag moral feedback path.
    const lowRiskCitizen = makeTestCitizen({ id: 'low-risk-citizen', risk_score_cache: 10 })
    useCitizenStore.setState(state => ({ skeletons: [...state.skeletons, lowRiskCitizen] }))

    useGameStore.getState().submitFlag(lowRiskCitizen.id, 'detention', 'wrong call')

    const wrongFlags = useGameStore.getState().wrongFlagsPendingMemo
    expect(wrongFlags).toHaveLength(1)
    expect(wrongFlags[0]!.flag_type).toBe('detention')
  })
})

describe('submitNoAction pipeline', () => {
  let citizen: CitizenSkeleton

  beforeEach(() => {
    citizen = bootstrapGameState()
  })

  it('decreases compliance score and records a no-action entry', () => {
    const before = useMetricsStore.getState().compliance_score
    useGameStore.getState().submitNoAction(citizen.id)
    const after = useMetricsStore.getState().compliance_score
    expect(after).toBeLessThan(before)
    expect(useGameStore.getState().noActions).toHaveLength(1)
    expect(useGameStore.getState().noActions[0]!.citizen_id).toBe(citizen.id)
  })

  it('does NOT enqueue a cinematic', () => {
    useGameStore.getState().submitNoAction(citizen.id)
    expect(useUIStore.getState().currentCinematic).toBeNull()
  })
})
