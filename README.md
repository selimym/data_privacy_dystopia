# Data Privacy Dystopia

An educational browser game that makes surveillance normalization tangible. You play as a government analyst operating a real-time intelligence platform — reviewing citizen files, flagging "risks", and watching the consequences unfold.

The game is designed around **the boiling frog effect**: the work starts reasonable and becomes increasingly unconscionable without any single obvious moment of moral failure.

---

## Quick Start

```bash
npm install     # or: make install
npm run dev     # or: make dev
# → http://localhost:5173
```

---

## Narrative Arc

### Act 1 — The Reasonable Work (Weeks 1–2)
You flag genuine criminals: drug dealers near schools, violent offenders. The data is limited (location + judicial records only). Quotas are small. The dashboard looks like a professional crime analytics tool.

### Act 2 — The Palantir Contract Expansion (Weeks 3–4)
The government signs new data-sharing contracts. Financial records unlock in Week 3 (follow the money → union organizers). Health records in Week 4 (NHS-style contract; mental health data now visible). Targets become more ambiguous. The **AutoFlag™ Bot** becomes available: the system can process the queue automatically. Quotas increase.

### Act 3 — The Machine Takes Over (Weeks 5–6)
Full social media and messaging data. The bot meets quotas perfectly. In Week 6, the bot flags **Jessica Martinez** — a specific NPC the game has been building toward. The player must actively intervene to stop it. Whether they do or don't, they are legally and morally responsible for every automated decision made under their operator ID.

---

## Game Mechanics

### Compliance & Reluctance
- **Compliance score** tracks how well you meet directives
- **Reluctance** rises when you hesitate (>30s decision time), refuse actions, or miss quotas
- Reluctance warnings fire at 70 / 80 / 90 — high reluctance leads to firing (early weeks) or imprisonment (later weeks)

### Public Metrics
- **Awareness** and **Anger** track public reaction to the surveillance program
- Severe flags, ICE raids, and arbitrary detentions spike both
- High awareness triggers protests, news coverage, and international condemnation

### AutoFlag™ Bot
- Unlocked in Week 4 via a contract event
- Runs a deterministic algorithm that mirrors ML classifier behavior (biased toward flagging based on risk thresholds)
- Displays "98.7% accuracy" — defined by the system's own criteria, not justice
- All bot decisions are logged under your operator ID
- You can override individual decisions or disable the bot entirely

### Contract Events
Palantir-style contract announcements arrive each week with a cheerful press release and an internal memo explaining what the contract actually enables. New data domains unlock progressively, changing what evidence is visible in citizen files.

### ICE Raid Orders
Generated when quota pressure is high and public anger is low (state feels safe to act). Targeting a neighborhood rather than an individual. Approving meets quota; declining increases reluctance.

### Endings (9 total)
Outcome depends on the combination of: compliance rate, reluctance level, bot usage, protest suppression, ICE raid approvals, and whether you intervened to protect Jessica.

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
│   ├── StartScreen/          # Country + language selection
│   ├── SystemDashboard/      # Intelligence dashboard (3-column layout)
│   │   ├── Header/           # Logo, operator code, week, contract banners
│   │   ├── DirectivePanel/   # Active directive, quota bar, ICE raid alerts
│   │   ├── CitizenQueue/     # Sortable case table with risk scores
│   │   ├── CitizenPanel/     # Subject file viewer with domain tabs
│   │   ├── MetricsPanel/     # Compliance, reluctance, public metrics gauges
│   │   ├── NewsPanel/        # Dynamic intelligence feed
│   │   └── WorldMapContainer/ # Phaser canvas (city map + NPC positions)
│   ├── EndingScreen/         # Outcome narrative, statistics, real-world parallels
│   └── shared/               # Modal, cinematic overlay, inference rules editor
├── services/                 # Pure TypeScript, no store imports
│   ├── InferenceEngine.ts    # Rule-based data fusion analysis
│   ├── RiskScorer.ts         # Citizen risk score calculation
│   ├── OutcomeGenerator.ts   # Consequence narratives
│   ├── AutoFlagBot.ts        # Deterministic flagging algorithm
│   ├── EndingCalculator.ts   # 9 ending conditions
│   ├── ProtestManager.ts     # Protest trigger + suppression
│   ├── ReluctanceTracker.ts  # Reluctance thresholds + warnings
│   ├── NewsGenerator.ts      # Dynamic article generation
│   ├── CitizenGenerator.ts   # Lazy NPC generation (Faker.js)
│   ├── TimeProgression.ts    # Week/directive advancement
│   ├── GameOrchestrator.ts   # Initialization coordinator
│   └── ContentLoader.ts      # JSON content loaders
├── stores/                   # Zustand stores
│   ├── gameStore.ts          # Directives, flags, contracts, autoflag
│   ├── citizenStore.ts       # Skeleton list + LRU profile cache (50 max)
│   ├── metricsStore.ts       # Compliance, reluctance, awareness, anger
│   ├── uiStore.ts            # Screen, selected citizen, cinematic queue
│   └── contentStore.ts       # Scenario, country profile, inference rules
├── phaser/
│   ├── WorldMapGame.ts       # Phaser.Game factory
│   └── scenes/
│       ├── PreloadScene.ts   # Asset loading
│       └── WorldMapScene.ts  # Tilemap, NPC sprites, camera
└── types/                    # TypeScript type definitions (zero `any`)
```

**Key rule:** stores call services, components call stores, Phaser never touches stores (one-way EventTarget bridge).

---

## Content

```
frontend/public/content/
├── scenarios/default.json       # Directives + contract events for each week
├── countries/                   # 5 country profiles (usa, uk, china, russia, france)
├── inference_rules.json         # User-editable inference rules
├── data_banks/                  # Domain reference data (health, finance, judicial, social, messages)
├── outcomes.json                # Outcome narrative templates
└── locales/en.json              # All UI strings
```

Each country profile defines: agency name, operator title, surveillance depth, available data domains, legal framework, and real-world references.

---

## Country Profiles

| Country | Agency | Surveillance Depth | Key Reference |
|---------|--------|-------------------|---------------|
| USA | Department of Homeland Intelligence | 3/3 | NSA PRISM, ICE data sharing |
| UK | GCHQ Civic Monitoring Division | 3/3 | Investigatory Powers Act 2016 |
| China | Ministry of Public Security | 3/3 | Social Credit System |
| Russia | FSB Civilian Analytics | 2/3 | SORM surveillance system |
| France | DGSI Civil Intelligence | 2/3 | French surveillance law 2015 |

---

## Testing

```bash
make test           # All E2E tests (Playwright)
make test-critical  # Critical path only (4 specs, must pass)
make test-unit      # Unit tests (Vitest, 50 tests)
make test-ui        # Playwright interactive UI
```

**Critical path specs:**
- `05-game-loop` — full week 1→6 loop, contract events, autoflag, ending
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

The game is a static site — deploy to any static host:

```bash
make build          # outputs frontend/dist/
make deploy-vercel  # deploy to Vercel
```

No environment variables required.

---

## Educational Goals

The game demonstrates:

1. **Data fusion risk** — individually harmless data points combine into revealing profiles
2. **Gradual normalization** — how surveillance expands scope without any single obvious overreach
3. **Automation diffusion of responsibility** — "I didn't flag her, the algorithm did" is not an exoneration
4. **Real-world parallels** — every mechanic references documented programs (Palantir NHS contract, PRISM, social credit systems, ICE–data sharing)

Each ending screen includes real-world references and educational links.

---

## Repository Structure

```
/
├── frontend/    # All game code (React 18 + Phaser 3 + Zustand)
└── LICENSE
```
