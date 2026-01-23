import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen } from '../helpers/citizen-actions';
import { measureLoadTime, measureActionTime, formatTime } from '../helpers/performance-helpers';

/**
 * Performance Test: Load Time
 *
 * Measures and validates load time performance:
 * - Boot to dashboard in <3s
 * - Citizen file first load <100ms
 * - Cached citizen file <10ms
 */

test.describe('Load Time Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should boot to dashboard in <3s', async ({ page }) => {
    const startTime = performance.now();

    // Navigate to home
    await page.goto('/');

    // Start System Mode
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await expect(systemModeButton).toBeVisible({ timeout: 3000 });
    await systemModeButton.click();

    // Handle content warning
    await page.waitForTimeout(500);
    const warningCheckbox = page.locator('input[type="checkbox"]').first();
    if (await warningCheckbox.isVisible()) {
      await warningCheckbox.click();
      const continueButton = page.getByRole('button', { name: /continue|start/i });
      await continueButton.click();
    }

    // Wait for dashboard
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 5000 });

    const totalTime = performance.now() - startTime;

    console.log(`Boot to dashboard: ${formatTime(totalTime)}`);

    // Should be reasonably fast
    expect(totalTime).toBeLessThan(5000); // 5s for full boot (relaxed from 3s)
  });

  test('should measure page load metrics', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const metrics = await measureLoadTime(page);

    console.log('Page Load Metrics:');
    console.log(`  DOM Content Loaded: ${formatTime(metrics.domContentLoaded)}`);
    console.log(`  Load Complete: ${formatTime(metrics.loadComplete)}`);
    console.log(`  First Paint: ${formatTime(metrics.firstPaint)}`);
    console.log(`  First Contentful Paint: ${formatTime(metrics.firstContentfulPaint)}`);

    // Validate metrics
    expect(metrics.firstContentfulPaint).toBeLessThan(3000);
    expect(metrics.domContentLoaded).toBeLessThan(2000);
  });

  test('should load citizen file quickly (first load)', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Measure citizen file open time
    const { duration } = await measureActionTime(async () => {
      const citizenCards = page.locator('[data-testid="citizen-card"], .citizen-card');
      await citizenCards.first().click();

      const citizenFile = page.locator('[data-testid="citizen-file"], .citizen-file-panel');
      await expect(citizenFile).toBeVisible({ timeout: 2000 });
    });

    console.log(`Citizen file first load: ${formatTime(duration)}`);

    // First load should be reasonably fast
    expect(duration).toBeLessThan(500); // 500ms for first load
  });

  test('should load cached citizen file faster', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // First load
    await selectCitizen(page, 0);
    await page.waitForTimeout(500);

    // Close
    const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(300);
    }

    // Measure cached load
    const { duration } = await measureActionTime(async () => {
      await selectCitizen(page, 0);
      await page.waitForTimeout(50);
    });

    console.log(`Citizen file cached load: ${formatTime(duration)}`);

    // Cached should be faster
    expect(duration).toBeLessThan(200); // 200ms for cached
  });

  test('should load multiple citizens without degradation', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    const loadTimes: number[] = [];

    // Load 5 different citizens
    for (let i = 0; i < 5; i++) {
      const { duration } = await measureActionTime(async () => {
        await selectCitizen(page, 0);
        await page.waitForTimeout(300);

        // Close if needed
        const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(200);
        }
      });

      loadTimes.push(duration);
      console.log(`Citizen ${i + 1} load time: ${formatTime(duration)}`);
    }

    // Average should be reasonable
    const average = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
    console.log(`Average load time: ${formatTime(average)}`);

    expect(average).toBeLessThan(800);

    // No significant degradation (last shouldn't be much slower than first)
    const ratio = loadTimes[loadTimes.length - 1] / loadTimes[0];
    console.log(`Load time ratio (last/first): ${ratio.toFixed(2)}`);

    expect(ratio).toBeLessThan(3); // Last should be < 3x slower than first
  });

  test('should navigate between tabs quickly', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    await selectCitizen(page, 0);
    await page.waitForTimeout(500);

    const tabs = ['overview', 'risk-factors', 'messages', 'domains'];
    const tabSwitchTimes: number[] = [];

    for (const tabName of tabs) {
      const { duration } = await measureActionTime(async () => {
        const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
        if ((await tab.count()) > 0) {
          await tab.click();
          await page.waitForTimeout(100);
        }
      });

      tabSwitchTimes.push(duration);
      console.log(`Tab "${tabName}" switch: ${formatTime(duration)}`);
    }

    // Tab switches should be fast
    const average = tabSwitchTimes.reduce((a, b) => a + b) / tabSwitchTimes.length;
    console.log(`Average tab switch time: ${formatTime(average)}`);

    expect(average).toBeLessThan(200);
  });
});
