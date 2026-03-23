/**
 * ContentLoader — async loaders for all /content/ JSON files.
 * Caches responses in memory after first load.
 *
 * Paths are relative to Vite's BASE_URL so the app works both on a
 * plain dev server (base="/") and on GitHub Pages (base="/repo-name/").
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

/** Resolve a content-relative path against Vite's base URL. */
function contentUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}content/${relativePath}`
}

export async function loadScenario(key: string): Promise<Scenario> {
  return loadJSON<Scenario>(contentUrl(`scenarios/${key}.json`))
}

export async function loadCountryProfile(key: string): Promise<CountryProfile> {
  return loadJSON<CountryProfile>(contentUrl(`countries/${key}.json`))
}

export async function loadInferenceRules(): Promise<InferenceRule[]> {
  const data = await loadJSON<{ rules: InferenceRule[] }>(contentUrl('inference_rules.json'))
  return data.rules
}

export async function loadOutcomeTemplates(): Promise<OutcomeTemplates> {
  return loadJSON<OutcomeTemplates>(contentUrl('outcomes.json'))
}

export async function loadDataBanks(): Promise<DataBanks> {
  const [health, finance, judicial, social, messages] = await Promise.all([
    loadJSON(contentUrl('data_banks/health.json')),
    loadJSON(contentUrl('data_banks/finance.json')),
    loadJSON(contentUrl('data_banks/judicial.json')),
    loadJSON(contentUrl('data_banks/social.json')),
    loadJSON(contentUrl('data_banks/messages.json')),
  ])
  return { health, finance, judicial, social, messages } as DataBanks
}

export function clearCache(): void {
  cache.clear()
}

export function invalidateCacheEntry(path: string): void {
  cache.delete(path)
}
