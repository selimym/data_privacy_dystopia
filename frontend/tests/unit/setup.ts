// Polyfill localStorage for Vitest Node environment.
// uiStore.ts reads localStorage at module load time; without this, any test
// that imports a store throws ReferenceError: localStorage is not defined.
const _storage: Record<string, string> = {}

globalThis.localStorage = {
  getItem: (key: string): string | null => _storage[key] ?? null,
  setItem: (key: string, value: string): void => { _storage[key] = value },
  removeItem: (key: string): void => { delete _storage[key] },
  clear: (): void => { for (const k in _storage) delete _storage[k] },
  get length(): number { return Object.keys(_storage).length },
  key: (index: number): string | null => Object.keys(_storage)[index] ?? null,
} as Storage
