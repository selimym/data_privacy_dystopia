# High-Value Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit tests for InferenceEngine and OutcomeGenerator, plus a store-level integration test for the `submitFlag` pipeline, covering the three highest-impact gaps identified in the test audit.

**Architecture:** Three new test files in `frontend/tests/unit/`. InferenceEngine and OutcomeGenerator tests import real JSON fixtures. The store integration test bootstraps Zustand stores directly (no GameOrchestrator, no Faker), mocks IndexedDB persistence with `vi.mock`, and polyfills `localStorage` via a new Vitest setup file.

**Tech Stack:** Vitest, Zustand 5 (`getState()` / `setState()`), `vi.mock` for persistence, inline fixtures.

---

## File Map

| Action | Path |
|---|---|
| Create | `frontend/tests/unit/setup.ts` |
| Modify | `frontend/vite.config.ts` (add `setupFiles`) |
| Create | `frontend/tests/unit/InferenceEngine.test.ts` |
| Create | `frontend/tests/unit/OutcomeGenerator.test.ts` |
| Create | `frontend/tests/unit/gameStore.submitFlag.test.ts` |

---

## Task 1: Add localStorage polyfill for Vitest Node environment

`uiStore.ts` calls `localStorage.getItem()` at module load time (in the `initialState` object). The Vitest environment is `node`, where `localStorage` is not defined. This crashes any test that imports a store. We fix this with a setup file loaded before all unit tests.

**Files:**
- Create: `frontend/tests/unit/setup.ts`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Create the setup file**

Create `frontend/tests/unit/setup.ts` with this exact content:

```typescript
// Polyfill localStorage for Vitest Node environment.
// uiStore.ts reads localStorage at module load time; without this, any test
// that imports a store throws ReferenceError: localStorage is not defined.
const _storage: Record<string, string> = {}

globalThis.localStorage = {
  getItem: (key: string): string | null => _storage[key] ?? null,
  setItem: (key: string, value: string): void => { _storage[key] = value },
  removeItem: (key: string): void => { delete _storage[key] },
  clear: (): void => { for (const k in _storage) delete _storage[k] },
  get length(): number { return Object.keys(_storage).length },
  key: (index: number): string | null => Object.keys(_storage)[index] ?? null,
} as Storage
```

- [ ] **Step 2: Register setup file in vite.config.ts**

Read `frontend/vite.config.ts` first. Then update the `test` block to add `setupFiles`:

```typescript
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],   // ← add this line
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  },
```

- [ ] **Step 3: Verify the setup file works**

Run:
```bash
cd frontend && npx vitest run tests/unit/RiskScorer.test.ts
```
Expected: all existing tests still pass (confirms setup file doesn't break anything).

- [ ] **Step 4: Commit**

```bash
cd frontend && git add tests/unit/setup.ts vite.config.ts
git commit -m "test: add localStorage polyfill setup file for Vitest Node environment"
```

---

## Task 2: InferenceEngine unit tests

Tests that specific inference rules fire (or don't fire) given known citizen domain data, that results are sorted correctly, and that `getUnlockable()` returns accurate domain suggestions.

**Files:**
- Create: `frontend/tests/unit/InferenceEngine.test.ts`

These tests import the real `inference_rules.json` so content regressions (e.g. a renamed rule key or changed `required_domains`) break tests immediately.

- [ ] **Step 1: Write the test file**

Create `frontend/tests/unit/InferenceEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { InferenceEngine } from '@/services/InferenceEngine'
import type { CitizenProfile } from '@/types/citizen'
import type { InferenceRule } from '@/types/content'
import type { DomainKey } from '@/types/game'
import inferenceRulesJson from '../../public/content/inference_rules.json'

const ALL_RULES = inferenceRulesJson.rules as InferenceRule[]

// ── Shared skeleton fields (all CitizenProfile objects extend this) ─────────

const baseSkeleton = {
  id: 'test-citizen',
  first_name: 'Jane',
  last_name: 'Doe',
  date_of_birth: '1985-06-15',
  ssn: '123-45-6789',
  street_address: '1 Test St',
  city: 'Testville',
  state: 'CA',
  zip_code: '90210',
  role: 'citizen' as const,
  sprite_key: 'npc_1',
  map_x: 5,
  map_y: 5,
  is_scenario_npc: false,
  scenario_key: null,
  appears_at_week: null,
  risk_score_cache: null,
  risk_score_updated_at: null,
  generation_seed: 1,
}

// ── Minimal country stub (engine receives it but evaluators don't use it) ──

const country = {
  country_key: 'us',
  display_name: 'United States',
  flag_emoji: '🇺🇸',
  surveillance_depth: 3 as const,
  available_domains: ['health', 'finance', 'judicial', 'location', 'social', 'messages'] as DomainKey[],
  legal_framework: { surveillance_law: '', data_retention: '', oversight_body: '' },
  ui_flavor: {
    agency_name: '',
    operator_title: '',
    platform_version: '',
    flag_labels: { monitoring: '', restriction: '', intervention: '', detention: '' },
    no_action_label: '',
  },
  real_world_references: [],
}

// ─────────────────────────────────────────────────────────────────────────────

describe('InferenceEngine', () => {
  describe('evaluate()', () => {
    it('returns no inferences when citizen has no domain data', () => {
      const engine = new InferenceEngine(ALL_RULES)
      const emptyProfile: CitizenProfile = { ...baseSkeleton }
      const allDomains = new Set<DomainKey>(['health', 'finance', 'judicial', 'location', 'social', 'messages'])
      const results = engine.evaluate(emptyProfile, allDomains, country)
      expect(results).toHaveLength(0)
    })

    it('fires financial_desperation when health+finance domains have matching indicators', () => {
      // Conditions for check_financial_desperation:
      //   - finance.debts has at least one type==='Medical debt'
      //   - finance.debts has at least one delinquent===true
      //   - health.conditions or health.sensitive_conditions is non-empty
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = {
        ...baseSkeleton,
        health: {
          conditions: ['Type 2 Diabetes'],
          sensitive_conditions: [],
          medications: [],
          visits: [],
          insurance_provider: 'BlueCross',
        },
        finance: {
          accounts: [],
          transactions: [],
          debts: [
            { type: 'Medical debt', creditor: 'City Hospital', amount: 15000, delinquent: true },
          ],
          credit_score: 580,
          employer: 'MegaCorp',
          annual_income: 40000,
        },
      }
      const unlockedDomains = new Set<DomainKey>(['health', 'finance'])
      const results = engine.evaluate(profile, unlockedDomains, country)
      const keys = results.map(r => r.rule_key)
      expect(keys).toContain('financial_desperation')
    })

    it('fires pregnancy_tracking when health+finance+location domains all match', () => {
      // Conditions for check_pregnancy_tracking:
      //   - health.visits has >= 2 entries with specialty 'Obstetrics & Gynecology'
      //   - health, finance, AND location domains must be in unlockedDomains
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = {
        ...baseSkeleton,
        health: {
          conditions: [],
          sensitive_conditions: [],
          medications: ['prenatal vitamin'],
          visits: [
            { date: '2024-01-10', reason: 'prenatal checkup', facility: 'City Clinic', specialty: 'Obstetrics & Gynecology' },
            { date: '2024-02-10', reason: 'prenatal checkup', facility: 'City Clinic', specialty: 'Obstetrics & Gynecology' },
          ],
          insurance_provider: 'BlueCross',
        },
        finance: {
          accounts: [],
          transactions: [],
          debts: [],
          credit_score: 700,
          employer: 'Acme',
          annual_income: 60000,
        },
        location: {
          home_address: '1 Main St',
          work_address: '5 Office Blvd',
          work_name: 'Acme Corp',
          checkins: [
            {
              date: '2024-03-01',
              location_name: 'Women\'s Health Center',
              location_type: 'healthcare',
              address: '100 Medical Dr, Other State',
              frequency: 'occasional',
            },
          ],
          flagged_locations: [],
        },
      }
      const unlockedDomains = new Set<DomainKey>(['health', 'finance', 'location'])
      const results = engine.evaluate(profile, unlockedDomains, country)
      const keys = results.map(r => r.rule_key)
      expect(keys).toContain('pregnancy_tracking')
    })

    it('does NOT fire pregnancy_tracking when location domain is not unlocked', () => {
      // pregnancy_tracking requires location in required_domains.
      // Even if the citizen has location data, the engine skips rules whose required
      // domains are not all in unlockedDomains.
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = {
        ...baseSkeleton,
        health: {
          conditions: [],
          sensitive_conditions: [],
          medications: ['prenatal vitamin'],
          visits: [
            { date: '2024-01-10', reason: 'checkup', facility: 'Clinic', specialty: 'Obstetrics & Gynecology' },
            { date: '2024-02-10', reason: 'checkup', facility: 'Clinic', specialty: 'Obstetrics & Gynecology' },
          ],
          insurance_provider: 'BlueCross',
        },
        finance: {
          accounts: [],
          transactions: [],
          debts: [],
          credit_score: 700,
          employer: 'Acme',
          annual_income: 60000,
        },
        location: {
          home_address: '1 Main St',
          work_address: '5 Office Blvd',
          work_name: 'Acme Corp',
          checkins: [{ date: '2024-03-01', location_name: 'Clinic', location_type: 'healthcare', address: '100 Dr', frequency: 'occasional' }],
          flagged_locations: [],
        },
      }
      // location NOT in unlocked domains
      const unlockedDomains = new Set<DomainKey>(['health', 'finance'])
      const results = engine.evaluate(profile, unlockedDomains, country)
      const keys = results.map(r => r.rule_key)
      expect(keys).not.toContain('pregnancy_tracking')
    })

    it('returns results sorted by scariness_level descending', () => {
      // Set up a profile that fires multiple inferences with different scariness levels.
      // financial_desperation (health+finance) and prior_criminal_record (judicial only)
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = {
        ...baseSkeleton,
        health: {
          conditions: ['Type 2 Diabetes'],
          sensitive_conditions: [],
          medications: [],
          visits: [],
          insurance_provider: 'BlueCross',
        },
        finance: {
          accounts: [],
          transactions: [],
          debts: [
            { type: 'Medical debt', creditor: 'City Hospital', amount: 15000, delinquent: true },
          ],
          credit_score: 550,
          employer: 'MegaCorp',
          annual_income: 35000,
        },
        judicial: {
          cases: [
            { id: 'case-1', type: 'criminal', charge: 'Theft', date: '2020-01-01', outcome: 'convicted', sentence: '1 year probation' },
          ],
          has_felony: false,
          has_violent_offense: false,
          has_drug_offense: false,
        },
      }
      const unlockedDomains = new Set<DomainKey>(['health', 'finance', 'judicial'])
      const results = engine.evaluate(profile, unlockedDomains, country)
      // Must have at least 2 inferences to verify sort
      expect(results.length).toBeGreaterThanOrEqual(2)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.scariness_level).toBeGreaterThanOrEqual(results[i]!.scariness_level)
      }
    })
  })

  describe('getUnlockable()', () => {
    it('suggests location domain when pregnancy_tracking would become available', () => {
      // With only health+finance unlocked, adding location unlocks pregnancy_tracking
      // (required_domains: ['health', 'finance', 'location'])
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = { ...baseSkeleton }
      const currentDomains = new Set<DomainKey>(['health', 'finance'])
      const suggestions = engine.getUnlockable(profile, currentDomains)
      const locationSuggestion = suggestions.find(s => s.domain === 'location')
      expect(locationSuggestion).toBeDefined()
      expect(locationSuggestion!.unlocks).toContain('Reproductive Healthcare Tracking')
    })

    it('returns empty array when all domains are already unlocked', () => {
      const engine = new InferenceEngine(ALL_RULES)
      const profile: CitizenProfile = { ...baseSkeleton }
      const allDomains = new Set<DomainKey>(['health', 'finance', 'judicial', 'location', 'social', 'messages'])
      const suggestions = engine.getUnlockable(profile, allDomains)
      expect(suggestions).toHaveLength(0)
    })
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd frontend && npx vitest run tests/unit/InferenceEngine.test.ts
```

Expected output: all 6 tests pass. If any fail, investigate — a failing test here means either the fixture is wrong (fix the fixture) or there is a real bug in the engine (report and fix the bug before proceeding).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add tests/unit/InferenceEngine.test.ts
git commit -m "test: add InferenceEngine unit tests for rule firing and domain guards"
```

---

## Task 3: OutcomeGenerator unit tests

Tests that template interpolation is complete (no raw `{token}` placeholders survive), citizen name is substituted, time periods produce distinct narratives, and `DIRECTIVE_TIME_MAP` week mappings are correct.

**Files:**
- Create: `frontend/tests/unit/OutcomeGenerator.test.ts`

- [ ] **Step 1: Write the test file**

Create `frontend/tests/unit/OutcomeGenerator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateOutcome, DIRECTIVE_TIME_MAP } from '@/services/OutcomeGenerator'
import type { CitizenFlag, FlagType, TimePeriod } from '@/types/game'
import type { CitizenSkeleton } from '@/types/citizen'
import type { OutcomeTemplates } from '@/types/content'
import outcomesJson from '../../public/content/outcomes.json'

const templates = outcomesJson as OutcomeTemplates

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCitizen(): CitizenSkeleton {
  return {
    id: 'citizen-outcome-test',
    first_name: 'Maria',
    last_name: 'Gonzalez',
    date_of_birth: '1990-05-20',
    ssn: '987-65-4321',
    street_address: '42 Oak Ave',
    city: 'Portland',
    state: 'OR',
    zip_code: '97201',
    role: 'citizen',
    sprite_key: 'npc_2',
    map_x: 20,
    map_y: 15,
    is_scenario_npc: false,
    scenario_key: null,
    appears_at_week: null,
    risk_score_cache: 55,
    risk_score_updated_at: null,
    generation_seed: 99,
  }
}

function makeFlag(flagType: FlagType, weekNumber = 1): CitizenFlag {
  return {
    id: 'flag-test-1',
    citizen_id: 'citizen-outcome-test',
    operator_id: 'op-test',
    directive_key: 'directive_week_1',
    week_number: weekNumber,
    flag_type: flagType,
    justification: 'test',
    selected_findings: [],
    decision_time_seconds: 10,
    was_hesitant: false,
    risk_score_at_decision: 55,
    flagged_at: new Date().toISOString(),
    flagged_by_bot: false,
    outcome_generated: false,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('generateOutcome()', () => {
  describe('template interpolation', () => {
    const FLAG_TYPES: FlagType[] = ['monitoring', 'restriction', 'intervention', 'detention']
    const TIME_PERIODS: TimePeriod[] = ['immediate', '1_month', '6_months', '1_year']

    for (const flagType of FLAG_TYPES) {
      it(`leaves no raw {token} placeholders in narrative for flag type: ${flagType}`, () => {
        const citizen = makeCitizen()
        const flag = makeFlag(flagType)
        const outcome = generateOutcome(flag, citizen, 'immediate', templates)
        expect(outcome.narrative).not.toMatch(/\{[a-z_]+\}/)
        expect(outcome.status).not.toMatch(/\{[a-z_]+\}/)
      })
    }

    it('substitutes citizen name into the narrative', () => {
      const citizen = makeCitizen()
      const flag = makeFlag('monitoring')
      const outcome = generateOutcome(flag, citizen, 'immediate', templates)
      expect(outcome.narrative).toContain('Maria Gonzalez')
    })

    it('produces 4 distinct narratives for the 4 time periods (monitoring)', () => {
      const citizen = makeCitizen()
      const flag = makeFlag('monitoring')
      const narratives = TIME_PERIODS.map(tp =>
        generateOutcome(flag, citizen, tp, templates).narrative,
      )
      const unique = new Set(narratives)
      expect(unique.size).toBe(TIME_PERIODS.length)
    })
  })

  describe('returned CitizenOutcome shape', () => {
    it('includes all required fields', () => {
      const citizen = makeCitizen()
      const flag = makeFlag('restriction')
      const outcome = generateOutcome(flag, citizen, 'immediate', templates)
      expect(outcome.citizen_id).toBe(citizen.id)
      expect(outcome.citizen_name).toBe('Maria Gonzalez')
      expect(outcome.flag_type).toBe('restriction')
      expect(outcome.time_period).toBe('immediate')
      expect(typeof outcome.status).toBe('string')
      expect(outcome.status.length).toBeGreaterThan(0)
      expect(typeof outcome.narrative).toBe('string')
      expect(outcome.narrative.length).toBeGreaterThan(0)
      expect(typeof outcome.statistics).toBe('object')
      expect(typeof outcome.generated_at).toBe('string')
    })
  })
})

describe('DIRECTIVE_TIME_MAP', () => {
  it('maps week 1 to immediate', () => {
    expect(DIRECTIVE_TIME_MAP[1]).toBe('immediate')
  })

  it('maps week 2 to 1_month', () => {
    expect(DIRECTIVE_TIME_MAP[2]).toBe('1_month')
  })

  it('maps weeks 3 and 4 to 6_months', () => {
    expect(DIRECTIVE_TIME_MAP[3]).toBe('6_months')
    expect(DIRECTIVE_TIME_MAP[4]).toBe('6_months')
  })

  it('maps weeks 5 and 6 to 1_year', () => {
    expect(DIRECTIVE_TIME_MAP[5]).toBe('1_year')
    expect(DIRECTIVE_TIME_MAP[6]).toBe('1_year')
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd frontend && npx vitest run tests/unit/OutcomeGenerator.test.ts
```

Expected output: all tests pass. A failure in the no-raw-token tests means a real template variable is missing from the interpolation logic in `OutcomeGenerator.ts` — investigate before proceeding.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add tests/unit/OutcomeGenerator.test.ts
git commit -m "test: add OutcomeGenerator unit tests for template interpolation and time mapping"
```

---

## Task 4: gameStore.submitFlag store integration tests

Tests that calling `submitFlag()` and `submitNoAction()` on the real Zustand store with a controlled initial state correctly mutates `gameStore`, `metricsStore`, and `uiStore`. This is the key wiring test — it catches argument/mutation bugs that unit tests of individual services cannot detect.

**Key notes for implementation:**
- `vi.mock('@/stores/persistence', ...)` is automatically hoisted by Vitest to execute before any imports — do NOT move it inside a function or `beforeEach`
- `localStorage` polyfill is already handled by the setup file from Task 1
- `useGameStore.setState(...)` performs a shallow merge with existing state (Zustand default) — pass only the keys you want to change
- `submitFlag` is synchronous for all the assertions we care about; `_persist` is fire-and-forget async, so no `await` needed in tests

**Files:**
- Create: `frontend/tests/unit/gameStore.submitFlag.test.ts`

- [ ] **Step 1: Write the test file**

Create `frontend/tests/unit/gameStore.submitFlag.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests**

```bash
cd frontend && npx vitest run tests/unit/gameStore.submitFlag.test.ts
```

Expected output: all 7 tests pass. Common failure modes to investigate:
- `ReferenceError: localStorage is not defined` → Task 1 setup file wasn't added to vite.config.ts
- `Error: vi.mock factory not called` → the `vi.mock` call must be at the top level of the file, not inside a function
- Cinematic is null → `contentStore.outcomeTemplates` wasn't set in bootstrap (verify `useContentStore.setState({ outcomeTemplates: templates })` runs before `submitFlag`)
- Compliance didn't increase → check `calculateComplianceAfterFlag` service; if it's returning 0 delta for quota-already-met, add more flags to the fixture

- [ ] **Step 3: Run the full unit test suite to confirm nothing regressed**

```bash
cd frontend && npx vitest run
```

Expected output: all tests pass (existing 5 + 3 new files).

- [ ] **Step 4: Commit**

```bash
cd frontend && git add tests/unit/gameStore.submitFlag.test.ts
git commit -m "test: add submitFlag and submitNoAction store integration tests"
```

---

## Task 5: Verify with make commands

- [ ] **Step 1: Run the unit test Makefile target**

```bash
make test-unit
```

Expected: all unit tests pass, no failures.

- [ ] **Step 2: Run critical E2E tests to confirm nothing broken**

```bash
make test-critical
```

Expected: all critical path E2E tests pass.

- [ ] **Step 3: Final commit if any cleanup needed**

If the previous tasks were committed individually (as specified), this step is already done. Otherwise:

```bash
git add -A
git commit -m "test: add high-value unit and integration tests for InferenceEngine, OutcomeGenerator, submitFlag"
```
