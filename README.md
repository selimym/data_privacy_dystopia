# Data Privacy Dystopia

An educational browser game that makes surveillance normalization tangible. You play as a government analyst operating a real-time intelligence platform — reviewing citizen files, flagging "risks", and watching the consequences unfold.

The game is designed around **the boiling frog effect**: the work starts reasonable and becomes increasingly unconscionable without any single obvious moment of moral failure.

> **Work in progress.** The game is playable but not finished — some mechanics, endings, and content are still being developed.
>
> **[Play it here → selimym.github.io/data_privacy_dystopia](https://selimym.github.io/data_privacy_dystopia/)**
>
> Feedback and bug reports are very welcome — please [open an issue](https://github.com/selimym/data_privacy_dystopia/issues).

---

## Quick Start

```bash
make install    # npm install
make dev        # dev server → http://localhost:5173
```

---

## Gameplay

See **[docs/GAMEPLAY.md](docs/GAMEPLAY.md)** for the full narrative arc, mechanics, and week-by-week structure.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI + state | React 18, Zustand 5 |
| World map | Phaser 3 (mounted as React component) |
| Data generation | Faker.js 10 (deterministic seeds) |
| Persistence | IndexedDB via `idb` |
| i18n | react-i18next (English first) |
| Bundler | Vite 6 |
| Testing | Playwright (E2E), Vitest (unit) |

**Fat client**: all game logic runs in the browser. No backend required.

---

## Architecture

```
frontend/src/
├── components/
│   ├── StartScreen/              # Country + language selection
│   ├── SystemDashboard/          # Intelligence dashboard (3-column layout)
│   │   ├── Header/               # Logo, operator code, week, contract/autoflag banners
│   │   ├── DirectivePanel/       # Active directive, quota bar, week-8 countdown
│   │   ├── CitizenQueue/         # Sortable case table with risk scores
│   │   ├── CitizenPanel/         # Subject file viewer with domain tabs
│   │   ├── MetricsPanel/         # Compliance, reluctance, public metrics gauges
│   │   ├── NewsPanel/            # Dynamic intelligence feed
│   │   ├── NewsImagePanel/       # AI-generated news imagery
│   │   ├── NewsTicker/           # Scrolling headline ticker
│   │   ├── AlertsPanel/          # Protest modal, reluctance warnings
│   │   ├── ProtestBanner/        # Active protest interrupt banner
│   │   ├── NeighborhoodSweepPanel/ # Sweep directive UI
│   │   ├── SweepStatusPanel/     # Sweep result display
│   │   ├── TutorialOverlay/      # First-run guidance
│   │   └── WorldMapContainer/    # Phaser canvas (city map + NPC positions)
│   ├── EndingScreen/             # Outcome narrative, statistics, real-world parallels
│   ├── EndingsArchive/           # Replay past endings
│   ├── MemoScreen/               # Shift memo reader
│   └── shared/                   # Modal, cinematic overlay, inference rules editor, etc.
├── services/                     # Pure TypeScript, no store imports
│   ├── GameOrchestrator.ts       # Initialization coordinator (only entry point)
│   ├── InferenceEngine.ts        # Rule-based data fusion analysis
│   ├── RiskScorer.ts             # Citizen risk score calculation
│   ├── RiskComputeWorker.ts      # Web worker for off-thread risk scoring
│   ├── OutcomeGenerator.ts       # Consequence narratives
│   ├── AutoFlagBot.ts            # Deterministic flagging algorithm
│   ├── EndingCalculator.ts       # 9 ending conditions
│   ├── EndingsArchive.ts         # Persist + retrieve completed endings
│   ├── OperatorTracker.ts        # Operator compliance + status tracking
│   ├── ProtestManager.ts         # Protest trigger + suppression
│   ├── PublicMetricsCalculator.ts # Awareness/anger update formulas
│   ├── ReluctanceTracker.ts      # Reluctance thresholds + warnings
│   ├── NewsGenerator.ts          # Dynamic article generation
│   ├── CitizenGenerator.ts       # Lazy NPC generation (Faker.js)
│   ├── TimeProgression.ts        # Week/directive advancement
│   └── ContentLoader.ts          # JSON content loaders
├── stores/                       # Zustand stores
│   ├── gameStore.ts              # Directives, flags, contracts, autoflag
│   ├── citizenStore.ts           # Skeleton list + LRU profile cache (50 max)
│   ├── metricsStore.ts           # Compliance, reluctance, awareness, anger
│   ├── uiStore.ts                # Screen, selected citizen, cinematic queue
│   └── contentStore.ts           # Scenario, country profile, inference rules
├── phaser/
│   ├── WorldMapGame.ts           # Phaser.Game factory
│   └── scenes/
│       ├── PreloadScene.ts       # Asset loading
│       └── WorldMapScene.ts      # Tilemap, NPC sprites, camera
└── types/                        # TypeScript type definitions (zero `any`)
```

**Key rule:** stores call services, components call stores, Phaser never touches stores (one-way EventTarget bridge).

---

## Testing

```bash
make test           # All E2E tests (Playwright)
make test-critical  # Critical path only (4 specs, must pass)
make test-unit      # Unit tests (Vitest)
make test-ui        # Playwright interactive UI
```

**Critical path specs:**
- `05-game-loop` — full week 1→8 loop, contract events, autoflag, ending
- `06-start-screen` — country selection → dashboard renders
- `07-flag-submission-ui` — citizen file → flag submission → outcome
- `08-directive-advance` — week advance + metrics update

**Unit test coverage:**
- `EndingCalculator` — all 9 ending conditions
- `ProtestManager` — size formula, suppression odds
- `ReluctanceTracker` — thresholds at 70/80/90
- `AutoFlagBot` — determinism with same seed, quota satisfaction

---

## Deployment

Static site — deploy to any static host:

```bash
make build          # outputs frontend/dist/
```

No environment variables required.
