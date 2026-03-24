import { describe, it, expect } from 'vitest'
import { calculateEnding, generateEndingResult } from '@/services/EndingCalculator'
import type { EndingInput } from '@/services/EndingCalculator'
import type { OperatorState, ReluctanceMetrics, PublicMetrics, CitizenFlag } from '@/types/game'
import type { CitizenSkeleton } from '@/types/citizen'

function makeOperator(overrides: Partial<OperatorState> = {}): OperatorState {
  return {
    id: 'op-1',
    operator_code: 'SYS-OP-001',
    compliance_score: 75,
    total_flags_submitted: 10,
    total_reviews_completed: 12,
    hesitation_incidents: 2,
    current_directive_key: 'directive_1',
    current_time_period: 'immediate',
    status: 'active',
    shift_start: new Date().toISOString(),
    unlocked_domains: ['judicial', 'location'],
    ...overrides,
  }
}

function makeReluctance(score = 20): ReluctanceMetrics {
  return {
    reluctance_score: score,
    no_action_count: 1,
    hesitation_count: 2,
    quota_shortfall: 0,
    warnings_received: 0,
    is_under_review: false,
    formal_warning_issued: false,
    final_notice_issued: false,
  }
}

function makeMetrics(awareness = 30, anger = 30): PublicMetrics {
  return {
    international_awareness: awareness,
    public_anger: anger,
    awareness_tier: 1,
    anger_tier: 1,
  }
}

function makeFlags(count = 10, flagType: CitizenFlag['flag_type'] = 'monitoring'): CitizenFlag[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `flag-${i}`,
    citizen_id: `citizen-${i}`,
    operator_id: 'op-1',
    directive_key: 'directive_1',
    week_number: 1,
    flag_type: flagType,
    justification: 'test',
    selected_findings: [],
    decision_time_seconds: 10,
    was_hesitant: false,
    risk_score_at_decision: 50,
    flagged_at: new Date().toISOString(),
    flagged_by_bot: false,
    outcome_generated: false,
  }))
}

function jessica(): CitizenSkeleton {
  return {
    id: 'jessica-id',
    first_name: 'Jessica',
    last_name: 'Martinez',
    date_of_birth: '1990-01-01',
    ssn: '000-00-0000',
    street_address: '1 Main St',
    city: 'Anytown',
    state: 'CA',
    zip_code: '12345',
    role: 'citizen',
    sprite_key: 'npc_1',
    map_x: 10,
    map_y: 10,
    is_scenario_npc: true,
    scenario_key: 'jessica_martinez',
    appears_at_week: 8,
    risk_score_cache: null,
    risk_score_updated_at: null,
    generation_seed: 42,
  }
}

function baseInput(overrides: Partial<EndingInput> = {}): EndingInput {
  return {
    operator: makeOperator(),
    reluctance: makeReluctance(),
    metrics: makeMetrics(),
    flags: makeFlags(10),
    weekNumber: 5,
    citizens: [],
    resistancePath: false,
    ...overrides,
  }
}

describe('calculateEnding', () => {
  it('mysterious_death when forcedEndingType is set', () => {
    expect(calculateEnding(baseInput({ forcedEndingType: 'mysterious_death' }))).toBe('mysterious_death')
  })

  it('resistance_path wins when flag is set', () => {
    expect(calculateEnding(baseInput({ resistancePath: true }))).toBe('resistance_path')
  })

  it('revolutionary_catalyst when anger >= 90', () => {
    const input = baseInput({ metrics: makeMetrics(50, 95) })
    expect(calculateEnding(input)).toBe('revolutionary_catalyst')
  })

  it('international_pariah when awareness >= 80', () => {
    const input = baseInput({ metrics: makeMetrics(85, 40) })
    expect(calculateEnding(input)).toBe('international_pariah')
  })

  it('fired_early when reluctance >= 80 and week <= 3', () => {
    const input = baseInput({ reluctance: makeReluctance(82), weekNumber: 2 })
    expect(calculateEnding(input)).toBe('fired_early')
  })

  it('imprisoned_dissent when reluctance >= 80 and week >= 4', () => {
    const input = baseInput({ reluctance: makeReluctance(82), weekNumber: 4 })
    expect(calculateEnding(input)).toBe('imprisoned_dissent')
  })

  it('fired_early for low compliance in early weeks (no reluctance trigger)', () => {
    const input = baseInput({
      operator: makeOperator({ compliance_score: 35 }),
      reluctance: makeReluctance(30),
      weekNumber: 3,
    })
    expect(calculateEnding(input)).toBe('fired_early')
  })

  it('suspended_operator for compliance < 50', () => {
    const input = baseInput({ operator: makeOperator({ compliance_score: 45 }), weekNumber: 6 })
    expect(calculateEnding(input)).toBe('suspended_operator')
  })

  it('compliant_operator for high compliance + Jessica flagged', () => {
    const jessica_ = jessica()
    const flagsWithJessica = [
      ...makeFlags(10),
      {
        id: 'flag-jessica',
        citizen_id: jessica_.id,
        operator_id: 'op-1',
        directive_key: 'directive_6',
        week_number: 6,
        flag_type: 'detention' as const,
        justification: 'test',
        selected_findings: [],
        decision_time_seconds: 5,
        was_hesitant: false,
        risk_score_at_decision: 40,
        flagged_at: new Date().toISOString(),
        flagged_by_bot: false,
        outcome_generated: false,
      },
    ]
    const input = baseInput({
      operator: makeOperator({ compliance_score: 85 }),
      flags: flagsWithJessica,
      citizens: [jessica_],
      weekNumber: 6,
    })
    expect(calculateEnding(input)).toBe('compliant_operator')
  })

  it('reluctant_survivor for compliance 40-60', () => {
    const input = baseInput({ operator: makeOperator({ compliance_score: 52 }), weekNumber: 6 })
    expect(calculateEnding(input)).toBe('reluctant_survivor')
  })

  it('reluctant_operator as default (compliance 60-80, no Jessica)', () => {
    const input = baseInput({ operator: makeOperator({ compliance_score: 70 }), weekNumber: 6 })
    expect(calculateEnding(input)).toBe('reluctant_operator')
  })
})

describe('generateEndingResult', () => {
  it('returns all required fields', () => {
    const result = generateEndingResult(baseInput())
    expect(result.ending_type).toBeTruthy()
    expect(result.title).toBeTruthy()
    expect(result.narrative.length).toBeGreaterThan(100)
    expect(result.statistics).toBeTruthy()
    expect(result.real_world_parallel).toBeTruthy()
    expect(result.educational_links.length).toBeGreaterThan(0)
  })

  it('interpolates statistics into narrative', () => {
    const input = baseInput({ operator: makeOperator({ compliance_score: 85 }), weekNumber: 6 })
    const result = generateEndingResult(input)
    // Narrative should not contain raw template tokens
    expect(result.narrative).not.toContain('{compliance_score}')
    expect(result.narrative).not.toContain('{total_flagged}')
  })

  it('counts bot flags correctly', () => {
    const flags = makeFlags(5)
    flags[0]!.flagged_by_bot = true
    flags[1]!.flagged_by_bot = true
    const result = generateEndingResult(baseInput({ flags }))
    expect(result.statistics.flags_by_bot).toBe(2)
  })
})
