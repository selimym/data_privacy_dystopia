/**
 * Barrel export for all stores.
 * Also exposes window.__stores in development for Playwright tests.
 */
export { useGameStore } from './gameStore'
export { useCitizenStore } from './citizenStore'
export { useMetricsStore } from './metricsStore'
export { useUIStore } from './uiStore'
export { useContentStore } from './contentStore'
export { saveGameState, loadGameState, clearGameState, hasSavedGame } from './persistence'

// ─── Dev/test hook ────────────────────────────────────────────────────────────
if (import.meta.env.DEV) {
  // Lazy import to avoid circular reference in production
  Promise.all([
    import('./gameStore'),
    import('./citizenStore'),
    import('./metricsStore'),
    import('./uiStore'),
    import('./contentStore'),
  ]).then(([game, citizens, metrics, ui, content]) => {
    ;(window as unknown as Record<string, unknown>).__stores = {
      game: game.useGameStore,
      citizens: citizens.useCitizenStore,
      metrics: metrics.useMetricsStore,
      ui: ui.useUIStore,
      content: content.useContentStore,
    }
  })
}
