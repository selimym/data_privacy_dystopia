/**
 * EndingsArchive — cross-session persistence for endings the player has seen.
 * Uses localStorage so it survives page reloads across multiple playthroughs.
 */
import type { EndingType } from '@/types/game'

const STORAGE_KEY = 'dpe_endings_seen'

export function getSeenEndings(): EndingType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as EndingType[]
  } catch {
    return []
  }
}

export function markEndingSeen(type: EndingType): void {
  const seen = getSeenEndings()
  if (!seen.includes(type)) {
    seen.push(type)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  }
}

export function hasSeenAnyEnding(): boolean {
  return getSeenEndings().length > 0
}
