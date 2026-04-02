# Test Coverage: High-Value Unit & Integration Tests

**Date:** 2026-04-03
**Scope:** Three new test files targeting the most impactful coverage gaps identified in the test audit.

---

## Background

The existing test suite has strong E2E coverage (15 files) and unit tests for 5 core services (RiskScorer, EndingCalculator, AutoFlagBot, ProtestManager, ReluctanceTracker). The key gaps are:

- `InferenceEngine` — 13 data-correlation evaluators with zero unit tests
- `OutcomeGenerator` — template interpolation logic with zero unit tests
- `submitFlag` pipeline — 8-step multi-store orchestration tested only via E2E browser automation

These three gaps allow silent failures: a broken evaluator shows wrong risk scores, a broken template leaves raw `{tokens}` in citizen outcome narratives, a wiring bug in `submitFlag` produces wrong store state with no test failure until a full E2E run.

---

## Approach

**Fixtures:** Import real `inference_rules.json` and `outcomes.json` for InferenceEngine and OutcomeGenerator tests. This means content file changes that break the engine will also break tests. Store integration tests use inline minimal fixtures (no JSON loading, no Faker, no GameOrchestrator).

**Mocking:** Only `persistence.save()` is mocked in the store integration test, to avoid IndexedDB unavailability in the Vitest Node environment.

**File locations:** All three files go in `frontend/tests/unit/` alongside existing unit tests.

---

## File 1: `InferenceEngine.test.ts`

**Imports:** Real `inference_rules.json`, `InferenceEngine` class, relevant citizen types.

**Fixtures:** Inline `CitizenProfile` objects with domain data crafted to match or not match specific rule conditions.

### Test Cases

| # | Description | What it catches |
|---|---|---|
| 1 | No inferences when citizen has no domain data | Engine doesn't fabricate inferences |
| 2 | `financial_desperation` fires with matching health + finance data (medical debt + chronic condition + delinquency) | Evaluator logic correctness |
| 3 | `pregnancy_tracking` fires with matching health + finance + location data (OB/GYN visits + prenatal meds + out-of-state travel) | Multi-domain evaluator correctness |
| 4 | Citizen data partially matching a rule but missing a required domain produces no inference for that rule | Domain guard logic |
| 5 | Results are sorted by `scariness_level` descending | Sort order regression |
| 6 | `getUnlockable()` returns the correct domain suggestion when one more domain would trigger a rule | Unlock hint correctness |

---

## File 2: `OutcomeGenerator.test.ts`

**Imports:** Real `outcomes.json`, `generateOutcome` function, relevant types.

**Fixtures:** Minimal inline `CitizenFlag` and `CitizenSkeleton` objects.

### Test Cases

| # | Description | What it catches |
|---|---|---|
| 1 | No raw `{token}` placeholders in output — for all 4 flag types (`monitoring`, `restriction`, `intervention`, `detention`) | Template interpolation completeness |
| 2 | Citizen name appears in the narrative | `{name}` substitution |
| 3 | All 4 time periods (`immediate`, `1_month`, `6_months`, `1_year`) produce distinct narrative strings | Copy-paste template bug |
| 4 | Week-to-time-period mapping: week 1 → `immediate`, week 3 → `1_month`, week 5 → `6_months`, week 7 → `1_year` | `DIRECTIVE_TIME_MAP` correctness |
| 5 | Returned object has all required `CitizenOutcome` fields (status, narrative, statistics) | Schema completeness |

---

## File 3: `gameStore.submitFlag.test.ts`

**Type:** Store-level integration test. Exercises the full `submitFlag()` action on real Zustand stores with controlled initial state.

**Bootstrap helper:** `bootstrapGameState()` called in `beforeEach`:
- Resets all stores to initial state
- Injects one minimal `CitizenSkeleton` into `citizenStore`
- Sets `gameStore` with: minimal operator, week 1 `review` directive, empty flags array
- Sets `metricsStore` with baseline compliance and reluctance metrics
- Sets `uiStore.decisionTimerStart` to `Date.now() - 5000` (5-second decision time)
- Loads real `outcomes.json` into `contentStore` (required by `OutcomeGenerator` inside the pipeline)
- Mocks `persistence.save()` via `vi.mock()` to avoid IndexedDB

Store state is accessed and asserted via `useGameStore.getState()`, `useMetricsStore.getState()`, `useUIStore.getState()`.

### Test Cases

| # | Description | What it catches |
|---|---|---|
| 1 | Flag recorded in `gameStore.flags` with correct `citizen_id`, `flag_type`, `directive_key` | Core flag creation wiring |
| 2 | Operator compliance score increases in `metricsStore` after a compliant flag | OperatorTracker → metricsStore wiring |
| 3 | Cinematic enqueued in `uiStore.currentCinematic` with correct `citizenId` | OutcomeGenerator → uiStore wiring |
| 4 | Submitting a second flag accumulates in `flags` (no overwrite) | Append vs replace bug |
| 5 | Flag with risk score < 25 is added to `gameStore.wrongFlagsPending` | Wrong-flag detection wiring |
| 6 | `submitNoAction()` decreases compliance and does NOT enqueue a cinematic | No-action path isolation |

---

## What Is Explicitly Out of Scope

- React component tests (high maintenance, low bug-catching value)
- Cross-browser E2E (low ROI for educational project)
- `CitizenGenerator` determinism tests (lower priority)
- `PublicMetricsCalculator` unit tests (medium priority, separate effort)
