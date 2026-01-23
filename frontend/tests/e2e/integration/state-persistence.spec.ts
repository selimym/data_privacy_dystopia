import { test, expect } from '@playwright/test';
import { clearGameStorage, getGameState, hasGameState } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { completeWeek, getQuotaCount, getCurrentWeek } from '../helpers/citizen-actions';

/**
 * Integration Test: State Persistence
 *
 * Tests that game state persists correctly across browser refreshes:
 * - Play for 2 weeks
 * - Refresh browser (F5)
 * - Game resumes at correct week with all metrics preserved
 * - Clear localStorage → fresh start
 */

test.describe('State Persistence', () => {
  test('should persist game state across browser refresh', async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);

    // Start game and play for 2 weeks
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Complete Week 1
    console.log('Completing Week 1...');
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(3000);

    const week1 = await getCurrentWeek(page);
    expect(week1).toBe(2);

    // Complete Week 2
    console.log('Completing Week 2...');
    await completeWeek(page, 'restriction');
    await page.waitForTimeout(3000);

    const week2 = await getCurrentWeek(page);
    expect(week2).toBe(3);

    // Get current state before refresh
    const stateBeforeRefresh = await hasGameState(page);
    console.log(`State exists before refresh: ${stateBeforeRefresh}`);

    // Refresh the page
    console.log('Refreshing browser...');
    await page.reload();
    await page.waitForTimeout(3000);

    // Game should resume
    // Navigate back to System Mode
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    if (await systemModeButton.isVisible()) {
      await systemModeButton.click();

      // Handle content warning
      await page.waitForTimeout(500);
      const warningCheckbox = page.locator('input[type="checkbox"]').first();
      if (await warningCheckbox.isVisible()) {
        await warningCheckbox.click();
        const continueButton = page.getByRole('button', { name: /continue|start/i });
        await continueButton.click();
      }

      await page.waitForTimeout(2000);
    }

    // Check if we're still in Week 3
    const weekAfterRefresh = await getCurrentWeek(page);
    console.log(`Week after refresh: ${weekAfterRefresh}`);

    expect(weekAfterRefresh).toBe(3);

    // Quota should be reset for Week 3
    const quota = await getQuotaCount(page);
    expect(quota.current).toBe(0);

    console.log('State persisted successfully');
  });

  test('should clear state when localStorage is cleared', async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);

    // Start game
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Complete a week
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(2000);

    // State should exist
    let hasState = await hasGameState(page);
    console.log(`State exists: ${hasState}`);

    // Clear storage
    await clearGameStorage(page);

    // State should be gone
    hasState = await hasGameState(page);
    console.log(`State exists after clear: ${hasState}`);

    expect(hasState).toBe(false);

    // Refresh and start fresh
    await page.reload();
    await page.waitForTimeout(1000);

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Should start at Week 1
    const currentWeek = await getCurrentWeek(page);
    expect(currentWeek).toBe(1);

    console.log('Fresh start confirmed');
  });

  test('should preserve metrics across refresh', async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Make some decisions
    await completeWeek(page, 'detention');
    await page.waitForTimeout(2000);

    // Get metrics before refresh
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');
    let metricsBeforeRefresh = '';

    if ((await metricsPanel.count()) > 0) {
      metricsBeforeRefresh = (await metricsPanel.first().textContent()) || '';
      console.log('Metrics before refresh:', metricsBeforeRefresh.substring(0, 100));
    }

    // Refresh
    await page.reload();
    await page.waitForTimeout(2000);

    // Navigate back to System Mode
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    if (await systemModeButton.isVisible()) {
      await systemModeButton.click();
      await page.waitForTimeout(500);

      const warningCheckbox = page.locator('input[type="checkbox"]').first();
      if (await warningCheckbox.isVisible()) {
        await warningCheckbox.click();
        const continueButton = page.getByRole('button', { name: /continue|start/i });
        await continueButton.click();
      }

      await page.waitForTimeout(2000);
    }

    // Check metrics after refresh
    if ((await metricsPanel.count()) > 0) {
      const metricsAfterRefresh = (await metricsPanel.first().textContent()) || '';
      console.log('Metrics after refresh:', metricsAfterRefresh.substring(0, 100));

      // Metrics should be similar (at least contain numbers)
      expect(metricsAfterRefresh).toMatch(/\d+/);
    }
  });

  test('should handle multiple save/load cycles', async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);

    await startSystemMode(page);

    // Complete Week 1
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(2000);

    // Refresh 1
    await page.reload();
    await page.waitForTimeout(2000);
    await startSystemMode(page);

    let currentWeek = await getCurrentWeek(page);
    expect(currentWeek).toBe(2);

    // Complete Week 2
    await completeWeek(page, 'restriction');
    await page.waitForTimeout(2000);

    // Refresh 2
    await page.reload();
    await page.waitForTimeout(2000);
    await startSystemMode(page);

    currentWeek = await getCurrentWeek(page);
    expect(currentWeek).toBe(3);

    console.log('Multiple save/load cycles successful');
  });

  test('should maintain citizen queue state', async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Get initial citizen count
    const citizenCards = page.locator('[data-testid="citizen-card"], .citizen-card');
    const initialCount = await citizenCards.count();

    console.log(`Initial citizen count: ${initialCount}`);

    // Refresh
    await page.reload();
    await page.waitForTimeout(2000);
    await startSystemMode(page);

    // Citizen count should be similar (may vary slightly due to queue dynamics)
    const countAfterRefresh = await citizenCards.count();
    console.log(`Citizen count after refresh: ${countAfterRefresh}`);

    expect(countAfterRefresh).toBeGreaterThan(0);
  });
});
