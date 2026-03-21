# E2E Testing Strategy

Comprehensive Playwright test suite for the Data Privacy Distopia game.

## Overview

This test suite provides automated end-to-end testing covering all gameplay flows, with a focus on:
- **Critical path validation** - Core features that must always work
- **Feature coverage** - Comprehensive testing of all game features
- **Performance monitoring** - Load time, FPS, memory usage
- **Edge case handling** - Extreme behaviors and data validation
- **State persistence** - Save/load functionality

## Project Structure

```
tests/e2e/
├── critical-path/       # 5 specs - Must pass (no retries)
│   ├── 01-game-initialization.spec.ts
│   ├── 02-system-mode-core.spec.ts
│   ├── 03-flag-submission.spec.ts
│   ├── 04-time-progression.spec.ts
│   └── 05-endings.spec.ts
│
├── features/           # 6 specs - Comprehensive feature tests
│   ├── citizen-files.spec.ts
│   ├── no-action-flow.spec.ts
│   ├── hesitation-tracking.spec.ts
│   ├── cinematics.spec.ts
│   ├── main-menu.spec.ts
│   └── world-exploration.spec.ts
│
├── integration/        # 4 specs - Integration tests
│   ├── state-persistence.spec.ts
│   ├── event-flows.spec.ts (legacy)
│   ├── user-journey.spec.ts (legacy)
│   └── metrics-updates.spec.ts (legacy)
│
├── performance/        # 3 specs - Performance benchmarks
│   ├── load-time.spec.ts
│   ├── memory-usage.spec.ts
│   └── fps-monitoring.spec.ts
│
├── edge-cases/         # 2 specs - Edge case validation
│   ├── extreme-behaviors.spec.ts
│   └── data-validation.spec.ts
│
└── helpers/            # Reusable test utilities
    ├── test-data.ts           # Deterministic test data
    ├── indexeddb-helpers.ts   # Storage management
    ├── citizen-actions.ts     # Reusable actions
    ├── performance-helpers.ts # Performance measurement
    ├── game-setup.ts          # Game initialization
    ├── assertions.ts          # Custom assertions
    └── api-helpers.ts         # Test mode helpers
```

## Running Tests

### All Tests
```bash
cd frontend
pnpm test:e2e
```

### By Category
```bash
pnpm test:e2e:critical      # Critical path only
pnpm test:e2e:features      # Feature tests
pnpm test:e2e:integration   # Integration tests
pnpm test:e2e:performance   # Performance tests
pnpm test:e2e:edge-cases    # Edge cases
```

### Interactive Mode
```bash
pnpm test:e2e:ui            # Playwright UI mode
pnpm test:e2e:headed        # Run in headed browser
pnpm test:e2e:debug         # Debug mode
```

### View Reports
```bash
pnpm test:e2e:report        # Open HTML report
```

## Test Categories

### 1. Critical Path (Must Pass)

These tests validate core functionality and **must pass** for the build to succeed. No retries allowed.

- **Game Initialization**: Boot sequence, MainMenuScene rendering, settings modal
- **System Mode Core**: Dashboard loads, citizen files open, data populated
- **Flag Submission**: All 4 flag types, justification, quota updates
- **Time Progression**: Complete weeks, directives, quota reset
- **Endings**: Different ending triggers based on player behavior

**Failure Impact**: Blocks CI/CD pipeline

### 2. Features (Comprehensive)

Full coverage of game features. Allows 1 retry on CI.

- **Citizen Files**: All tabs load, performance benchmarks (<100ms first load)
- **No-Action Flow**: Compliance decreases, reluctance increases, warnings
- **Hesitation Tracking**: 30-second timer, counter increments
- **Cinematics**: Plays after flags, outcomes display, no infinite loops
- **Main Menu**: All buttons, settings, content warning
- **World Exploration**: Player movement, NPC interaction, map navigation

**Failure Impact**: Reported but doesn't block build

### 3. Integration (System-wide)

Tests that span multiple systems. Allows 2 retries.

- **State Persistence**: Save/load across browser refresh, metrics preserved
- **Event Flows**: Protests, news, exposure mechanics (legacy)
- **User Journey**: Complete playthroughs (legacy)
- **Metrics Updates**: Real-time polling (legacy)

**Failure Impact**: Reported but doesn't block build

### 4. Performance (Benchmarks)

Measures and validates performance metrics. 60-second timeout, 1 retry allowed.

- **Load Time**: Boot <3s, citizen file <100ms, cached <10ms
- **Memory Usage**: Initial footprint, <100MB total, no leaks
- **FPS Monitoring**: Average ≥55 FPS, minimum ≥30 FPS

**Failure Impact**: Reported as performance regression

### 5. Edge Cases (Stress Testing)

Extreme behaviors and data validation. Allows 2 retries.

- **Extreme Behaviors**: High compliance, many no-actions, alternating patterns
- **Data Validation**: Names coherent, ages 18-80, SSNs valid, no duplicates

**Failure Impact**: Reported but doesn't block build

## Helper Utilities

### test-data.ts
- `generateTestCitizen(id, seed)` - Deterministic citizen data
- `TEST_SCENARIOS` - Predefined test scenarios
- `validateCitizenData()` - Data validation
- `FLAG_TYPES` - Flag type definitions

### indexeddb-helpers.ts
- `clearGameStorage()` - Clear IndexedDB + localStorage
- `getGameState()` - Retrieve current state
- `setGameState()` - Set state programmatically
- `getAllNPCs()` - Get all citizens from storage

### citizen-actions.ts
- `selectCitizen(page, index)` - Select citizen from queue
- `flagCitizen(page, type, justification)` - Submit flag
- `submitNoAction(page, justification)` - Submit no-action
- `completeWeek(page, flagType)` - Complete full week
- `getQuotaCount()`, `getCurrentWeek()` - UI state helpers

### performance-helpers.ts
- `measureLoadTime()` - Page load metrics
- `getMemoryUsage()` - Chrome memory API
- `measureFPS(duration)` - Frame rate measurement
- `formatBytes()`, `formatTime()` - Formatting utilities

## Performance Benchmarks

### Load Time Targets
- Boot to dashboard: **<3 seconds**
- Citizen file first load: **<100ms**
- Citizen file cached load: **<10ms**
- Tab switching: **<200ms average**

### Memory Targets
- Initial footprint: **<50MB**
- After System Mode: **<100MB**
- No memory leaks (stable over multiple weeks)

### FPS Targets
- Average FPS: **≥55 FPS**
- Minimum FPS: **≥30 FPS** (no severe drops)
- During UI interaction: **≥50 FPS average**

## CI/CD Integration

Tests run on every push to `main`, `develop`, and `Refactoring_to_fat_client` branches.

### GitHub Actions Workflow

```
critical-path (must pass) ──┬──> features (continue-on-error)
                            ├──> integration (continue-on-error)
                            ├──> performance (continue-on-error)
                            └──> edge-cases (continue-on-error)
                                    │
                                    ▼
                               test-summary (fails if critical failed)
```

### Artifacts
- HTML test reports (30-day retention)
- Failure screenshots (7-day retention)
- Test results JSON

## Handling Broken/Flaky Tests

### Annotations

Use test annotations for known issues:

```typescript
// Known broken feature
test.skip('feature currently broken', async ({ page }) => {
  // See issue #145
});

// Known flaky test
test.describe.configure({ retries: 2 });
test('flaky polling test', async ({ page }) => {
  // May fail due to timing
});

// Expected failure
test.fail('known bug', async ({ page }) => {
  // Tracked in issue #150
});

// Slow test
test.slow();
test('long running test', async ({ page }) => {
  // Triples timeout
});
```

### Retry Strategy

- **Critical**: 0 retries (must pass first try)
- **Features**: 1 retry on CI
- **Integration**: 2 retries on CI
- **Performance**: 1 retry on CI
- **Edge cases**: 2 retries on CI

## Writing New Tests

### 1. Choose the Right Category

- Core functionality → `critical-path/`
- New feature → `features/`
- Cross-system behavior → `integration/`
- Performance concern → `performance/`
- Edge case/validation → `edge-cases/`

### 2. Use Helpers

```typescript
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, flagCitizen } from '../helpers/citizen-actions';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should do something', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', 'Test justification');
    // Assert...
  });
});
```

### 3. Follow Patterns

- Always clear storage in `beforeEach`
- Use data-testid selectors where possible
- Add meaningful console.log for debugging
- Handle async timing with waitForTimeout
- Close citizen files to reset state
- Skip cinematics to speed up tests

### 4. Performance Considerations

- Keep tests focused and fast
- Use `test.skip()` for long-running tests
- Measure performance with helpers
- Log metrics for debugging
- Consider test.slow() for >30s tests

## Troubleshooting

### Tests Timing Out
- Increase timeout in playwright.config.ts
- Check for infinite loops or blocking operations
- Add `test.slow()` for long tests

### Flaky Tests
- Add retries for timing-dependent tests
- Use explicit waits instead of arbitrary timeouts
- Check for race conditions
- Consider test.skip() if consistently flaky

### Storage Issues
- Ensure `clearGameStorage()` in beforeEach
- Check IndexedDB schema matches expectations
- Verify localStorage keys

### Selector Issues
- Update selectors if UI changed
- Use flexible patterns (data-testid preferred)
- Check for multiple matching elements

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Status Tracking](./test-status.json)
- [Manual Test Checklist](../../MANUAL_TEST_CHECKLIST.md)
- [CI/CD Workflow](/.github/workflows/e2e-tests.yml)

## Maintenance

### Regular Tasks
- Review and update test-status.json
- Monitor CI/CD test reports
- Update performance baselines
- Remove skipped tests when fixed
- Add tests for new features

### When Tests Fail
1. Check artifacts in GitHub Actions
2. Run locally with `pnpm test:e2e:debug`
3. Review failure screenshots
4. Check recent code changes
5. Update selectors if UI changed
6. Add test.skip() with issue reference if needed
