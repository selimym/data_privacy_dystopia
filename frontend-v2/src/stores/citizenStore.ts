/**
 * citizenStore — 50 citizen skeletons always in memory + LRU full-profile cache (max 50).
 * Full profiles are generated lazily from the skeleton's generation_seed.
 */
import { create } from 'zustand'
import type { CitizenSkeleton, CitizenProfile } from '@/types/citizen'
import { generateFullProfile } from '@/services/CitizenGenerator'
import type { DataBanks } from '@/types/content'
import type { CountryProfile } from '@/types/content'
import type { CaseOverview } from '@/types/citizen'
import type { DomainKey } from '@/types/game'

const LRU_MAX = 50

interface CitizenState {
  // All 50 skeletons (always in memory)
  skeletons: CitizenSkeleton[]

  // LRU profile cache: id → full profile
  profileCache: Map<string, CitizenProfile>
  // LRU order tracking: most-recently-used last
  cacheOrder: string[]

  // Actions
  initializePopulation: (skeletons: CitizenSkeleton[]) => void
  getProfile: (id: string, dataBanks: DataBanks, country: CountryProfile) => Promise<CitizenProfile>
  getCaseQueue: (unlockedDomains: DomainKey[]) => CaseOverview[]
  updateSkeletonCache: (id: string, riskScore: number) => void
  reset: () => void
}

export const useCitizenStore = create<CitizenState>((set, get) => ({
  skeletons: [],
  profileCache: new Map(),
  cacheOrder: [],

  initializePopulation: (skeletons) => {
    set({
      skeletons,
      profileCache: new Map(),
      cacheOrder: [],
    })
  },

  getProfile: async (id, dataBanks, country) => {
    const { profileCache, cacheOrder, skeletons } = get()

    // Cache hit
    if (profileCache.has(id)) {
      // Move to end of LRU order
      const newOrder = cacheOrder.filter(k => k !== id)
      newOrder.push(id)
      set({ cacheOrder: newOrder })
      return profileCache.get(id)!
    }

    // Cache miss — generate full profile
    const skeleton = skeletons.find(s => s.id === id)
    if (!skeleton) throw new Error(`Citizen ${id} not found in population`)

    const profile = await generateFullProfile(skeleton, dataBanks, country)

    // Add to cache, evict LRU if over limit
    const newCache = new Map(profileCache)
    const newOrder = [...cacheOrder.filter(k => k !== id), id]

    if (newOrder.length > LRU_MAX) {
      const evictId = newOrder.shift()!
      newCache.delete(evictId)
    }

    newCache.set(id, profile)
    set({ profileCache: newCache, cacheOrder: newOrder })
    return profile
  },

  getCaseQueue: (unlockedDomains) => {
    const { skeletons } = get()
    return skeletons.map(s => ({
      citizen_id: s.id,
      display_name: `${s.last_name}, ${s.first_name}`,
      risk_score: s.risk_score_cache ?? 0,
      risk_level:
        (s.risk_score_cache ?? 0) >= 80 ? 'severe'
        : (s.risk_score_cache ?? 0) >= 60 ? 'high'
        : (s.risk_score_cache ?? 0) >= 40 ? 'elevated'
        : (s.risk_score_cache ?? 0) >= 20 ? 'moderate'
        : 'low',
      available_domains: unlockedDomains,
      already_flagged: false,         // gameStore sets this via augmentation
      no_action_taken: false,
    } satisfies CaseOverview))
  },

  updateSkeletonCache: (id, riskScore) => {
    set(state => ({
      skeletons: state.skeletons.map(s =>
        s.id === id
          ? { ...s, risk_score_cache: riskScore, risk_score_updated_at: new Date().toISOString() }
          : s,
      ),
    }))
  },

  reset: () => set({ skeletons: [], profileCache: new Map(), cacheOrder: [] }),
}))
