/**
 * ContentLoader — async loaders for all /content/ JSON files.
 * Caches responses in memory after first load.
 */
import type { Scenario, CountryProfile, InferenceRule, DataBanks, OutcomeTemplates } from '@/types'

const cache = new Map<string, unknown>()

async function loadJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load content: ${path} (${res.status})`)
  const data = (await res.json()) as T
  cache.set(path, data)
  return data
}

export async function loadScenario(key: string): Promise<Scenario> {
  return loadJSON<Scenario>(`/content/scenarios/${key}.json`)
}

export async function loadCountryProfile(key: string): Promise<CountryProfile> {
  return loadJSON<CountryProfile>(`/content/countries/${key}.json`)
}

export async function loadInferenceRules(): Promise<InferenceRule[]> {
  const data = await loadJSON<{ rules: InferenceRule[] }>('/content/inference_rules.json')
  return data.rules
}

export async function loadOutcomeTemplates(): Promise<OutcomeTemplates> {
  return loadJSON<OutcomeTemplates>('/content/outcomes.json')
}

export async function loadDataBanks(): Promise<DataBanks> {
  const [health, finance, judicial, social, messages] = await Promise.all([
    loadJSON('/content/data_banks/health.json'),
    loadJSON('/content/data_banks/finance.json'),
    loadJSON('/content/data_banks/judicial.json'),
    loadJSON('/content/data_banks/social.json'),
    loadJSON('/content/data_banks/messages.json'),
  ])
  return { health, finance, judicial, social, messages } as DataBanks
}

export function clearCache(): void {
  cache.clear()
}

export function invalidateCacheEntry(path: string): void {
  cache.delete(path)
}
