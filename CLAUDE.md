# CLAUDE.md

Guide for Claude Code when working with this repository.

## Project Overview

Educational browser game demonstrating data privacy risks. The player operates a surveillance intelligence platform — reviewing citizen files, submitting flags, and watching consequences unfold. The game is structured as a **boiling frog** narrative: work starts reasonable and gradually becomes authoritarian without any single obvious moral crossroads.

**Architecture**: Fat client — all game logic runs in the browser. No backend. Static hosting.

## Tech Stack

- **React 18 + TypeScript** — UI and state
- **Zustand 5** — 5 stores (game, citizen, metrics, ui, content)
- **Phaser 3** — 2D world map only, mounted as a React component
- **Faker.js 10** — deterministic citizen data generation
- **idb** — IndexedDB persistence wrapper
- **Vite 6** — bundler (Phaser aliased to ESM build)
- **Playwright + Vitest** — E2E and unit tests

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

All active code is in `frontend/`:

```
frontend/src/
  components/         ← React components (StartScreen, SystemDashboard, EndingScreen)
  services/           ← Pure TypeScript game logic (no store imports)
  stores/             ← Zustand stores (gameStore, citizenStore, metricsStore, uiStore, contentStore)
  phaser/             ← Phaser scenes (WorldMapGame.ts, PreloadScene.ts, WorldMapScene.ts)
  types/              ← TypeScript type definitions (zero `any`)
  i18n.ts             ← react-i18next setup

frontend/public/content/
  scenarios/          ← default.json: directives + contract events per week
  countries/          ← 5 country profiles (usa, uk, china, russia, france)
  inference_rules.json
  data_banks/         ← health, finance, judicial, social, messages
  outcomes.json
  locales/en.json
```

## Architecture Rules

- **Stores call services. Components call stores. Phaser never touches stores.**
- Phaser communicates with React via a one-way `EventTarget` bridge
- All Phaser imports must use `import * as Phaser from 'phaser'` (ESM, no default export)
- All entities use `crypto.randomUUID()` UUIDs
- All citizen data generation uses Faker.js with deterministic seeds
- IndexedDB via `idb` wrapper in `stores/persistence.ts`
- `window.__stores` is exposed in development for test access

## Service Architecture

```
services/
  GameOrchestrator.ts   ← initializes everything; only entry point for game start
  InferenceEngine.ts    ← rule-based data fusion analysis
  RiskScorer.ts         ← citizen risk score (pure function)
  OutcomeGenerator.ts   ← consequence narratives (pure function)
  AutoFlagBot.ts        ← deterministic flagging algorithm; bot decisions log under operator ID
  EndingCalculator.ts   ← 9 endings in priority order
  ProtestManager.ts     ← protest trigger + suppression
  ReluctanceTracker.ts  ← warnings at 70/80/90
  NewsGenerator.ts      ← dynamic article generation
  CitizenGenerator.ts   ← generateSkeleton() + generateFullProfile() (lazy)
  TimeProgression.ts    ← week/directive advancement, contract event firing
  ContentLoader.ts      ← async JSON loaders for /content/
```

## Game Mechanics

- **6 directives** across 6 weeks; player flags citizens to meet quotas
- **Contract events** (weeks 3–4) unlock new data domains progressively
- **AutoFlag Bot** (week 4+) can process the queue automatically; player bears responsibility
- **Jessica Martinez** at seed slot 4472 is the narrative focal point in week 6
- **ICE raid orders** generated under quota pressure + low anger
- **9 endings** determined by: compliance, reluctance, bot usage, protest suppression, ICE approvals

## Store Data Flow

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

## Testing

```
frontend/tests/
  e2e/critical-path/    ← 4 specs; must all pass
  unit/                 ← EndingCalculator, ProtestManager, ReluctanceTracker, AutoFlagBot
```

Run `make test-critical` before any PR. Unit tests cover all 9 endings, protest formulas, reluctance thresholds, bot determinism.

## Important Rules

- Never add a backend — fat client only
- Never use `import Phaser from 'phaser'` — use `import * as Phaser from 'phaser'`
- TypeScript strict mode — zero `any`
- Keep services pure and testable
- All strings through `useTranslation()` in components
- All interactive elements need `data-testid` attributes
