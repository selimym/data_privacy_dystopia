/**
 * persistence.ts — IndexedDB save/load via the `idb` library.
 * Stores a single serialised snapshot of the game state.
 */
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'data-privacy-dystopia-v2'
const DB_VERSION = 1
const STORE_NAME = 'game-state'
const CURRENT_KEY = 'current'

export interface PersistedState {
  game: Record<string, unknown>
  citizens: Record<string, unknown>
  metrics: Record<string, unknown>
  ui: Record<string, unknown>
  content: Record<string, unknown>
  saved_at: string
}

let _db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
  return _db
}

export async function saveGameState(state: PersistedState): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, { ...state, saved_at: new Date().toISOString() }, CURRENT_KEY)
}

export async function loadGameState(): Promise<PersistedState | null> {
  const db = await getDB()
  return (await db.get(STORE_NAME, CURRENT_KEY)) ?? null
}

export async function clearGameState(): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, CURRENT_KEY)
}

export async function hasSavedGame(): Promise<boolean> {
  const state = await loadGameState()
  return state !== null
}
