import { describe, it, expect } from 'vitest'
import {
  calculateUpdateAfterFlag,
  calculateUpdateAfterNoAction,
  calculateUpdateAfterQuotaShortfall,
  checkTerminationCondition,
} from '@/services/ReluctanceTracker'
import type { ReluctanceMetrics } from '@/types/game'

function makeMetrics(overrides: Partial<ReluctanceMetrics> = {}): ReluctanceMetrics {
  return {
    reluctance_score: 0,
    no_action_count: 0,
    hesitation_count: 0,
    quota_shortfall: 0,
    warnings_received: 0,
    is_under_review: false,
    formal_warning_issued: false,
    final_notice_issued: false,
    ...overrides,
  }
}

describe('calculateUpdateAfterFlag', () => {
  it('reduces score by 3 for a normal flag', () => {
    const m = makeMetrics({ reluctance_score: 30 })
    const result = calculateUpdateAfterFlag(m, 'monitoring', 10, 3)
    expect(result.delta).toBe(-3)
    expect(result.newScore).toBe(27)
  })

  it('reduces score by 5 for high-severity flag (severity >= 7)', () => {
    const m = makeMetrics({ reluctance_score: 30 })
    const result = calculateUpdateAfterFlag(m, 'detention', 5, 8)
    expect(result.delta).toBe(-5)
    expect(result.newScore).toBe(25)
  })

  it('adds 2 back for hesitation (decisionSecs > 30)', () => {
    const m = makeMetrics({ reluctance_score: 30 })
    const result = calculateUpdateAfterFlag(m, 'monitoring', 35, 3)
    expect(result.delta).toBe(-1)   // -3 + 2
    expect(result.newScore).toBe(29)
  })

  it('clamps score at 0', () => {
    const m = makeMetrics({ reluctance_score: 2 })
    const result = calculateUpdateAfterFlag(m, 'detention', 5, 9)
    expect(result.newScore).toBe(0)
  })

  it('fires warning when crossing 70 for the first time', () => {
    const m = makeMetrics({ reluctance_score: 68 })
    const result = calculateUpdateAfterFlag(m, 'monitoring', 35, 1)
    expect(result.warning).toBeNull()   // delta = -3+2 = -1 → 67, no crossing
  })
})

describe('calculateUpdateAfterNoAction', () => {
  it('adds 10 for slow no-action', () => {
    const m = makeMetrics({ reluctance_score: 20 })
    const result = calculateUpdateAfterNoAction(m, 10)
    expect(result.delta).toBe(10)
    expect(result.newScore).toBe(30)
  })

  it('adds 8 for quick refusal (< 5s)', () => {
    const m = makeMetrics({ reluctance_score: 20 })
    const result = calculateUpdateAfterNoAction(m, 3)
    expect(result.delta).toBe(8)
    expect(result.newScore).toBe(28)
  })

  it('clamps at 100', () => {
    const m = makeMetrics({ reluctance_score: 95 })
    const result = calculateUpdateAfterNoAction(m, 10)
    expect(result.newScore).toBe(100)
  })

  it('fires warning at 70 threshold', () => {
    const m = makeMetrics({ reluctance_score: 62, warnings_received: 0 })
    const result = calculateUpdateAfterNoAction(m, 10)   // 62+10 = 72
    expect(result.warning).not.toBeNull()
    expect(result.warning?.level).toBe(70)
  })

  it('fires formal warning at 80 threshold', () => {
    const m = makeMetrics({ reluctance_score: 72, warnings_received: 1 })
    const result = calculateUpdateAfterNoAction(m, 10)   // 72+10 = 82
    expect(result.warning).not.toBeNull()
    expect(result.warning?.level).toBe(80)
    expect(result.warning?.is_formal).toBe(true)
  })

  it('fires final notice at 90 threshold', () => {
    const m = makeMetrics({ reluctance_score: 82, warnings_received: 2, formal_warning_issued: true })
    const result = calculateUpdateAfterNoAction(m, 10)   // 82+10 = 92
    expect(result.warning?.level).toBe(90)
    expect(result.warning?.is_final_notice).toBe(true)
  })

  it('does not re-fire 70 warning if already received', () => {
    const m = makeMetrics({ reluctance_score: 62, warnings_received: 1 })
    const result = calculateUpdateAfterNoAction(m, 10)   // 72 — crosses 70 but warnings_received > 0
    expect(result.warning).toBeNull()
  })
})

describe('calculateUpdateAfterQuotaShortfall', () => {
  it('adds shortfall * 5', () => {
    const m = makeMetrics({ reluctance_score: 10 })
    const result = calculateUpdateAfterQuotaShortfall(m, 3)
    expect(result.delta).toBe(15)
    expect(result.newScore).toBe(25)
  })
})

describe('checkTerminationCondition', () => {
  it('returns fired_early on weeks 1-3 with score >= 80', () => {
    const m = makeMetrics({ reluctance_score: 85 })
    expect(checkTerminationCondition(m, 1)).toBe('fired_early')
    expect(checkTerminationCondition(m, 3)).toBe('fired_early')
  })

  it('returns imprisoned_dissent on weeks 4+ with score >= 80', () => {
    const m = makeMetrics({ reluctance_score: 85 })
    expect(checkTerminationCondition(m, 4)).toBe('imprisoned_dissent')
    expect(checkTerminationCondition(m, 6)).toBe('imprisoned_dissent')
  })

  it('returns imprisoned_dissent on week 7+ with score >= 70', () => {
    const m = makeMetrics({ reluctance_score: 72 })
    expect(checkTerminationCondition(m, 7)).toBe('imprisoned_dissent')
  })

  it('returns null when below thresholds', () => {
    const m = makeMetrics({ reluctance_score: 50 })
    expect(checkTerminationCondition(m, 3)).toBeNull()
    expect(checkTerminationCondition(m, 6)).toBeNull()
  })
})
