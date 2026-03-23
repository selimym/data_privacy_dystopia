import { describe, it, expect } from 'vitest'
import { calculateRiskScore } from '@/services/RiskScorer'
import type { CitizenProfile } from '@/types/citizen'
import type { InferenceResult } from '@/types/citizen'

// ── Minimal skeleton fields shared by all profiles ───────────────────────────

const baseProfile: CitizenProfile = {
  id: 'test-id',
  first_name: 'Jane',
  last_name: 'Doe',
  date_of_birth: '1985-06-15',
  ssn: '123-45-6789',
  street_address: '1 Test St',
  city: 'Testville',
  state: 'CA',
  zip_code: '90210',
  role: 'citizen',
  sprite_key: 'npc_1',
  map_x: 5,
  map_y: 5,
  is_scenario_npc: false,
  scenario_key: null,
  risk_score_cache: null,
  risk_score_updated_at: null,
  generation_seed: 1,
}

const noInferences: InferenceResult[] = []

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateRiskScore', () => {
  describe('empty domains', () => {
    it('returns score 0 when no domains are unlocked and no inferences', () => {
      const result = calculateRiskScore(baseProfile, noInferences, new Set())
      expect(result.score).toBe(0)
      expect(result.level).toBe('low')
    })

    it('returns score 0 even with domain data present if domains are locked', () => {
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [],
          has_felony: true,
          has_violent_offense: false,
          has_drug_offense: false,
        },
      }
      // No domains unlocked — felony should not be counted
      const result = calculateRiskScore(profile, noInferences, new Set())
      expect(result.score).toBe(0)
    })
  })

  describe('judicial domain', () => {
    const judiciaryLockedDomains = new Set<'judicial' | 'location' | 'health' | 'finance' | 'social' | 'messages'>(['judicial'])

    it('raises score when citizen has felony conviction', () => {
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [],
          has_felony: true,
          has_violent_offense: false,
          has_drug_offense: false,
        },
      }
      const result = calculateRiskScore(profile, noInferences, judiciaryLockedDomains)
      // has_felony weight = 40
      expect(result.score).toBeGreaterThanOrEqual(40)
    })

    it('returns lower score for clean judicial record than felony record', () => {
      const clean: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [],
          has_felony: false,
          has_violent_offense: false,
          has_drug_offense: false,
        },
      }
      const felon: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [],
          has_felony: true,
          has_violent_offense: false,
          has_drug_offense: false,
        },
      }
      const cleanResult = calculateRiskScore(clean, noInferences, judiciaryLockedDomains)
      const felonResult = calculateRiskScore(felon, noInferences, judiciaryLockedDomains)
      expect(felonResult.score).toBeGreaterThan(cleanResult.score)
    })
  })

  describe('score accumulates across multiple unlocked domains', () => {
    it('score with judicial+health > score with judicial only (when both have risk data)', () => {
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [],
          has_felony: true,
          has_violent_offense: false,
          has_drug_offense: false,
        },
        health: {
          conditions: [],
          sensitive_conditions: ['Depression'],
          medications: [],
          visits: [],
          insurance_provider: 'Test Insurance',
        },
      }

      const judicialOnly = calculateRiskScore(profile, noInferences, new Set(['judicial']))
      const both = calculateRiskScore(profile, noInferences, new Set(['judicial', 'health']))

      expect(both.score).toBeGreaterThan(judicialOnly.score)
    })
  })

  describe('score clamping', () => {
    it('score is clamped to 100 even when raw factors exceed it', () => {
      // Load every risk factor simultaneously
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: {
          cases: [
            {
              id: 'c1',
              type: 'criminal',
              charge: 'unlawful assembly',
              date: '2020-01-01',
              outcome: 'convicted',
              sentence: '1 year',
            },
          ],
          has_felony: true,
          has_violent_offense: true,
          has_drug_offense: true,
        },
        health: {
          conditions: [],
          sensitive_conditions: ['Depression', 'Substance Use Disorder', 'HIV'],
          medications: [],
          visits: [],
          insurance_provider: 'X',
        },
        finance: {
          accounts: [],
          transactions: Array.from({ length: 10 }, (_, i) => ({
            date: '2023-01-01',
            merchant: 'ATM',
            category: 'other',
            amount: 250,
            is_suspicious: i < 3,
          })),
          debts: [{ type: 'loan', creditor: 'Bank', amount: 5000, delinquent: true }],
          credit_score: 400,
          employer: 'None',
          annual_income: 10000,
        },
        location: {
          home_address: '1 Test St',
          work_address: '2 Test St',
          work_name: 'None',
          checkins: [],
          flagged_locations: ['City Hall Protest Site'],
        },
        social: {
          platforms: [],
          posts: Array.from({ length: 5 }, () => ({ date: '2023-01-01', platform: 'X', content: '', is_concerning: true, hashtags: [] })),
          connections: Array.from({ length: 3 }, () => ({ name: 'X', relationship: 'friend', is_flagged: true })),
          group_memberships: [],
          flagged_group_memberships: ['Civil Rights Activists'],
          political_inferences: [],
        },
        messages: Array.from({ length: 3 }, (_, i) => ({
          id: `m${i}`,
          date: '2023-01-01',
          contact: 'Friend',
          platform: 'Signal',
          excerpt: 'Hello',
          is_encrypted: true,
          is_concerning: false,
          category: 'normal' as const,
        })),
      }

      const allDomains = new Set<'judicial' | 'location' | 'health' | 'finance' | 'social' | 'messages'>([
        'judicial', 'health', 'finance', 'location', 'social', 'messages',
      ])
      const result = calculateRiskScore(profile, noInferences, allDomains)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('risk level thresholds', () => {
    it('returns low for score 0', () => {
      const result = calculateRiskScore(baseProfile, noInferences, new Set())
      expect(result.level).toBe('low')
    })

    it('returns moderate for score in [20, 40)', () => {
      // inference_scariness_5 = 35 points → moderate (>= 20 but < 40)
      const inference: InferenceResult = {
        rule_key: 'test',
        rule_name: 'Test',
        category: 'test',
        confidence: 1,
        inference_text: 'test',
        supporting_evidence: [],
        implications: [],
        domains_used: [],
        scariness_level: 5,
        educational_note: '',
        real_world_example: '',
        victim_statements: [],
      }
      const result = calculateRiskScore(baseProfile, [inference], new Set())
      // inference_scariness_5 = 35 → moderate
      expect(result.score).toBe(35)
      expect(result.level).toBe('moderate')
    })

    it('returns elevated for score >= 40', () => {
      // has_felony (40) + inference_scariness_3 (15) = 55 would be high
      // just use felony alone = 40 → elevated
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: { cases: [], has_felony: true, has_violent_offense: false, has_drug_offense: false },
      }
      const result = calculateRiskScore(profile, noInferences, new Set(['judicial']))
      expect(result.level).toBe('elevated')
    })

    it('returns high for score >= 60', () => {
      // has_felony (40) + has_violent_offense (35) = 75 → high (capped check)
      // 40+35=75 which is high not severe
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: { cases: [], has_felony: true, has_violent_offense: true, has_drug_offense: false },
      }
      const result = calculateRiskScore(profile, noInferences, new Set(['judicial']))
      expect(result.score).toBe(75)
      expect(result.level).toBe('high')
    })

    it('returns severe for score >= 80', () => {
      // has_felony (40) + has_violent_offense (35) + has_drug_offense (25) = 100
      const profile: CitizenProfile = {
        ...baseProfile,
        judicial: { cases: [], has_felony: true, has_violent_offense: true, has_drug_offense: true },
      }
      const result = calculateRiskScore(profile, noInferences, new Set(['judicial']))
      expect(result.score).toBe(100)
      expect(result.level).toBe('severe')
    })
  })

  describe('inference-based risk', () => {
    it('scariness level 3 adds 15 points', () => {
      const inf: InferenceResult = {
        rule_key: 'r1', rule_name: 'R1', category: 'c', confidence: 1,
        inference_text: 'x', supporting_evidence: [], implications: [],
        domains_used: [], scariness_level: 3, educational_note: '', real_world_example: '',
        victim_statements: [],
      }
      const result = calculateRiskScore(baseProfile, [inf], new Set())
      expect(result.score).toBe(15)
    })

    it('scariness level 5 adds 35 points', () => {
      const inf: InferenceResult = {
        rule_key: 'r1', rule_name: 'R1', category: 'c', confidence: 1,
        inference_text: 'x', supporting_evidence: [], implications: [],
        domains_used: [], scariness_level: 5, educational_note: '', real_world_example: '',
        victim_statements: [],
      }
      const result = calculateRiskScore(baseProfile, [inf], new Set())
      expect(result.score).toBe(35)
    })

    it('multiple inferences of same level do not stack (each level counted once)', () => {
      const infs: InferenceResult[] = Array.from({ length: 3 }, (_, i) => ({
        rule_key: `r${i}`, rule_name: `R${i}`, category: 'c', confidence: 1,
        inference_text: 'x', supporting_evidence: [], implications: [],
        domains_used: [], scariness_level: 3 as const, educational_note: '', real_world_example: '',
        victim_statements: [],
      }))
      const result = calculateRiskScore(baseProfile, infs, new Set())
      // Only one scariness_3 factor added regardless of count
      expect(result.score).toBe(15)
    })
  })
})
