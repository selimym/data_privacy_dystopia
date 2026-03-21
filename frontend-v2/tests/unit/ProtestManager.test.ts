import { describe, it, expect } from 'vitest'
import {
  calculateProtestSize,
  resolveSuppressionAttempt,
  FLAG_TYPE_SEVERITY,
} from '@/services/ProtestManager'
import type { PublicMetrics, ProtestEvent } from '@/types/game'

function makeMetrics(anger = 50): PublicMetrics {
  return {
    international_awareness: 30,
    public_anger: anger,
    awareness_tier: 1,
    anger_tier: 1,
  }
}

function makeProtest(size = 200): ProtestEvent {
  return {
    id: 'test-protest',
    size,
    neighborhood: 'Downtown District',
    status: 'forming',
    has_inciting_agent: false,
    triggered_by_action: 'detention',
    awareness_impact: 2,
    anger_impact: 1,
    started_at: new Date().toISOString(),
    acknowledged: false,
  }
}

describe('calculateProtestSize', () => {
  it('returns a value between 50 and 5000', () => {
    for (let i = 0; i < 50; i++) {
      const size = calculateProtestSize(50, 6)
      expect(size).toBeGreaterThanOrEqual(50)
      expect(size).toBeLessThanOrEqual(5000)
    }
  })

  it('increases with higher anger', () => {
    // Average over many runs to cancel out random variance
    const lowSamples = Array.from({ length: 100 }, () => calculateProtestSize(10, 5))
    const highSamples = Array.from({ length: 100 }, () => calculateProtestSize(80, 5))
    const avgLow = lowSamples.reduce((a, b) => a + b) / lowSamples.length
    const avgHigh = highSamples.reduce((a, b) => a + b) / highSamples.length
    expect(avgHigh).toBeGreaterThan(avgLow)
  })

  it('increases with higher severity', () => {
    const lowSamples = Array.from({ length: 100 }, () => calculateProtestSize(50, 2))
    const highSamples = Array.from({ length: 100 }, () => calculateProtestSize(50, 9))
    const avgLow = lowSamples.reduce((a, b) => a + b) / lowSamples.length
    const avgHigh = highSamples.reduce((a, b) => a + b) / highSamples.length
    expect(avgHigh).toBeGreaterThan(avgLow)
  })
})

describe('resolveSuppressionAttempt — DECLARE_ILLEGAL', () => {
  it('always succeeds', () => {
    const protest = makeProtest()
    const metrics = makeMetrics()
    for (let i = 0; i < 20; i++) {
      const result = resolveSuppressionAttempt('DECLARE_ILLEGAL', protest, metrics)
      expect(result.success).toBe(true)
      expect(result.backfire).toBe(false)
      expect(result.arrests).toBeGreaterThanOrEqual(5)
      expect(result.arrests).toBeLessThanOrEqual(15)
      expect(result.casualties).toBe(0)
    }
  })

  it('generates appropriate narrative', () => {
    const result = resolveSuppressionAttempt('DECLARE_ILLEGAL', makeProtest(300), makeMetrics())
    expect(result.narrative).toContain('300')
    expect(result.awareness_delta).toBe(8)
    expect(result.anger_delta).toBe(6)
  })
})

describe('resolveSuppressionAttempt — INCITE_VIOLENCE', () => {
  it('sometimes succeeds and sometimes backlashes', () => {
    const protest = makeProtest()
    const metrics = makeMetrics()
    let successes = 0
    let backfires = 0
    for (let i = 0; i < 200; i++) {
      const result = resolveSuppressionAttempt('INCITE_VIOLENCE', protest, metrics)
      if (result.success) successes++
      if (result.backfire) backfires++
    }
    // ~60% success, ~40% backfire — allow ±20% tolerance
    expect(successes).toBeGreaterThan(80)    // at least 40%
    expect(successes).toBeLessThan(170)      // at most 85%
    expect(backfires).toBeGreaterThan(30)    // at least 15%
  })

  it('backfire has much higher awareness/anger delta', () => {
    // Run until we get a backfire
    let backfire = null
    for (let i = 0; i < 1000; i++) {
      const result = resolveSuppressionAttempt('INCITE_VIOLENCE', makeProtest(), makeMetrics())
      if (result.backfire) { backfire = result; break }
    }
    expect(backfire).not.toBeNull()
    expect(backfire!.awareness_delta).toBeGreaterThan(10)
    expect(backfire!.anger_delta).toBeGreaterThan(10)
  })
})

describe('FLAG_TYPE_SEVERITY', () => {
  it('has expected severity values', () => {
    expect(FLAG_TYPE_SEVERITY['monitoring']).toBe(2)
    expect(FLAG_TYPE_SEVERITY['detention']).toBe(8)
    expect(FLAG_TYPE_SEVERITY['APPROVE_ICE_RAID']).toBe(9)
    expect(FLAG_TYPE_SEVERITY['INCITE_VIOLENCE']).toBe(8)
  })
})
