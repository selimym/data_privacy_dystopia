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
