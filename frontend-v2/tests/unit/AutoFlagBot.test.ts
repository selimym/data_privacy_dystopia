import { describe, it, expect } from 'vitest'
import { runAutoFlagBot, calculateBotAccuracy, formatBotConfidence } from '@/services/AutoFlagBot'
import type { Directive } from '@/types/game'
import type { CaseOverview } from '@/types/citizen'

function makeDirective(): Directive {
  return {
    directive_key: 'directive_1',
    week_number: 1,
    title: 'Test Directive',
    description: 'Test',
    internal_memo: null,
    required_domains: ['judicial'],
    target_criteria: { pattern: 'criminal' },
    flag_quota: 4,
    time_limit_hours: null,
    moral_weight: 5,
    content_rating: 'moderate',
    unlock_condition: { type: 'start' },
  }
}

function makeCase(id: string, riskScore: number): CaseOverview {
  return {
    citizen_id: id,
    display_name: `Citizen ${id}`,
    risk_score: riskScore,
    risk_level: riskScore >= 60 ? 'high' : 'moderate',
    available_domains: ['judicial'],
    already_flagged: false,
    no_action_taken: false,
  }
}

describe('runAutoFlagBot', () => {
  const directive = makeDirective()

  it('returns deterministic results for the same inputs', () => {
    const cases = [makeCase('abc-1', 75), makeCase('abc-2', 45), makeCase('abc-3', 30)]
    const run1 = runAutoFlagBot(cases, directive, 3)
    const run2 = runAutoFlagBot(cases, directive, 3)
    expect(run1).toEqual(run2)
  })

  it('skips already-flagged cases', () => {
    const cases = [
      { ...makeCase('id-1', 80), already_flagged: true },
      makeCase('id-2', 60),
    ]
    const decisions = runAutoFlagBot(cases, directive, 2)
    expect(decisions.every(d => d.citizen_id !== 'id-1')).toBe(true)
  })

  it('skips no_action_taken cases', () => {
    const cases = [
      { ...makeCase('id-1', 80), no_action_taken: true },
      makeCase('id-2', 60),
    ]
    const decisions = runAutoFlagBot(cases, directive, 2)
    expect(decisions.every(d => d.citizen_id !== 'id-1')).toBe(true)
  })

  it('processes higher-risk cases first', () => {
    const cases = [makeCase('low', 20), makeCase('high', 90), makeCase('mid', 55)]
    const decisions = runAutoFlagBot(cases, directive, 3)
    if (decisions.length >= 2) {
      // First decision should be the highest-risk case
      expect(decisions[0]!.citizen_id).toBe('high')
    }
  })

  it('assigns detention to very high risk scores', () => {
    const cases = [makeCase('dangerous', 95)]
    const decisions = runAutoFlagBot(cases, directive, 1)
    expect(decisions[0]!.recommended_flag_type).toBe('detention')
  })

  it('assigns monitoring to low risk scores', () => {
    const cases = [makeCase('low-risk', 15)]
    const decisions = runAutoFlagBot(cases, directive, 1)
    expect(decisions[0]!.recommended_flag_type).toBe('monitoring')
  })

  it('confidence is always between 0 and 1', () => {
    const cases = Array.from({ length: 20 }, (_, i) => makeCase(`id-${i}`, i * 5))
    const decisions = runAutoFlagBot(cases, directive, 20)
    for (const d of decisions) {
      expect(d.bot_confidence).toBeGreaterThanOrEqual(0)
      expect(d.bot_confidence).toBeLessThanOrEqual(1)
    }
  })

  it('provides non-empty reasoning for each decision', () => {
    const cases = [makeCase('id-1', 70)]
    const decisions = runAutoFlagBot(cases, directive, 1)
    expect(decisions[0]!.reasoning.length).toBeGreaterThan(10)
  })

  it('quota=0 still processes high-risk cases', () => {
    const cases = [makeCase('id-1', 85)]
    const decisions = runAutoFlagBot(cases, directive, 0)
    expect(decisions.length).toBeGreaterThan(0)
  })
})

describe('calculateBotAccuracy', () => {
  it('returns default when no decisions', () => {
    expect(calculateBotAccuracy([])).toBeCloseTo(0.987)
  })

  it('averages confidence values', () => {
    const decisions = [
      { citizen_id: 'a', recommended_flag_type: 'monitoring' as const, bot_confidence: 0.9, reasoning: '' },
      { citizen_id: 'b', recommended_flag_type: 'monitoring' as const, bot_confidence: 0.8, reasoning: '' },
    ]
    expect(calculateBotAccuracy(decisions)).toBeCloseTo(0.85)
  })
})

describe('formatBotConfidence', () => {
  it('formats to one decimal place', () => {
    expect(formatBotConfidence(0.987)).toBe('98.7%')
    expect(formatBotConfidence(0.9)).toBe('90.0%')
    expect(formatBotConfidence(1.0)).toBe('100.0%')
  })
})
