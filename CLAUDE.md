# CLAUDE.md

## Project

Educational browser game about surveillance normalization. Fat client — all logic in the browser, no backend. See `docs/GAMEPLAY.md` for narrative/mechanics, `README.md` for architecture.

## Tech Stack

React 18 + TypeScript, Zustand 5 (5 stores), Phaser 3 (world map only), Faker.js 10 (deterministic seeds), idb (IndexedDB), Vite 6, Playwright + Vitest.

## Commands

```bash
make dev              # Dev server on http://localhost:5173
make install          # npm install
make build            # Production build
make test             # All E2E tests (Playwright)
make test-critical    # Critical path E2E only
make test-unit        # Unit tests (Vitest)
make test-ui          # Playwright interactive UI
make clean            # Remove node_modules + dist
```

## Key Directories

```
frontend/src/
  components/   ← React UI
  services/     ← Pure TS game logic (no store imports)
  stores/       ← Zustand (game, citizen, metrics, ui, content)
  phaser/       ← WorldMapGame.ts, PreloadScene.ts, WorldMapScene.ts
  types/        ← zero `any`

frontend/public/content/
  scenarios/default.json   ← 8 directives + contract events
  inference_rules.json
  data_banks/              ← health, finance, judicial, social, messages
  outcomes.json
  locales/en.json
```

## Architecture Rules

- **Stores call services. Components call stores. Phaser never touches stores.**
- Phaser ↔ React via one-way `EventTarget` bridge only
- `import * as Phaser from 'phaser'` — never default import
- All UUIDs via `crypto.randomUUID()`
- All citizen data via Faker.js with deterministic seeds
- All interactive elements need `data-testid` attributes
- All strings through `useTranslation()` in components

## Store Data Flow (flag submission)

```
submitFlag(citizenId, flagType, justification)
  → ReluctanceTracker     → metricsStore
  → PublicMetrics         → metricsStore
  → NewsGenerator         → gameStore.newsArticles
  → ProtestManager        → gameStore.activeProtests
  → OperatorTracker       → gameStore.operator
  → OutcomeGenerator      → uiStore.cinematicQueue
  → EndingCalculator      → uiStore.screen (if terminal)
  → persistence.save()
```

`GameOrchestrator.ts` is the only entry point for game initialization.

## Game Facts

- 8 weeks / 8 directives; Jessica Martinez (week 8) is the narrative focal point
- AutoFlag Bot available from week 4; all bot decisions log under the player's operator ID
- 9 endings determined by: compliance, reluctance, bot usage, protest suppression, ICE approvals

## Important Rules

- No backend — fat client only
- TypeScript strict mode — zero `any`
- Services must remain pure and testable
- Run `make test-critical` before any PR
- All strings through `useTranslation()` in components
- All interactive elements need `data-testid` attributes
