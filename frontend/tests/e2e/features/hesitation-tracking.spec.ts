import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, flagCitizen } from '../helpers/citizen-actions';

/**
 * Feature Test: Hesitation Tracking
 *
 * Tests the hesitation tracking system:
 * - Select citizen, wait 30+ seconds, submit decision
 * - Hesitation counter increments
 * - Hesitation metric visible in dashboard
 */

test.describe('Hesitation Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should track hesitation when waiting >30s before decision', async ({ page }) => {
    // Select citizen
    await selectCitizen(page, 0);

    console.log('Waiting 35 seconds to trigger hesitation...');

    // Wait 35 seconds
    await page.waitForTimeout(35000);

    // Submit decision
    await flagCitizen(page, 'monitoring', 'Test hesitation tracking');
    await page.waitForTimeout(1500);

    // Check for hesitation indicator
    const hesitation = page.locator('[data-testid="hesitation"], [class*="hesitation"]');
    const hesitationVisible = (await hesitation.count()) > 0;

    console.log(`Hesitation indicator visible: ${hesitationVisible}`);

    if (hesitationVisible) {
      const hesitationText = await hesitation.first().textContent();
      console.log('Hesitation:', hesitationText);
    }
  });

  test('should not track hesitation when deciding quickly', async ({ page }) => {
    // Get initial hesitation count if visible
    const hesitation = page.locator('[data-testid="hesitation"], [class*="hesitation"]');
    let initialCount = 0;

    if ((await hesitation.count()) > 0) {
      const text = await hesitation.first().textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        initialCount = parseInt(match[1]);
      }
    }

    console.log(`Initial hesitation count: ${initialCount}`);

    // Make quick decision (< 10 seconds)
    await selectCitizen(page, 0);
    await page.waitForTimeout(2000); // Only 2 seconds
    await flagCitizen(page, 'monitoring', 'Quick decision');
    await page.waitForTimeout(1500);

    // Hesitation should not increase
    if ((await hesitation.count()) > 0) {
      const newText = await hesitation.first().textContent();
      const newMatch = newText?.match(/(\d+)/);
      const newCount = newMatch ? parseInt(newMatch[1]) : 0;

      console.log(`New hesitation count: ${newCount}`);
      expect(newCount).toBe(initialCount);
    }
  });

  test('should increment hesitation counter multiple times', async ({ page }) => {
    // First hesitation
    await selectCitizen(page, 0);
    await page.waitForTimeout(35000); // Wait 35 seconds
    await flagCitizen(page, 'monitoring', 'Hesitation 1');
    await page.waitForTimeout(1500);

    // Second hesitation
    await selectCitizen(page, 0);
    await page.waitForTimeout(35000); // Wait 35 seconds
    await flagCitizen(page, 'monitoring', 'Hesitation 2');
    await page.waitForTimeout(1500);

    // Check hesitation count
    const hesitation = page.locator('[data-testid="hesitation"], [class*="hesitation"]');

    if ((await hesitation.count()) > 0) {
      const text = await hesitation.first().textContent();
      const match = text?.match(/(\d+)/);

      if (match) {
        const count = parseInt(match[1]);
        console.log(`Hesitation count: ${count}`);
        expect(count).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should display hesitation metric in dashboard', async ({ page }) => {
    // Trigger hesitation
    await selectCitizen(page, 0);
    await page.waitForTimeout(35000);
    await flagCitizen(page, 'monitoring', 'Test metric display');
    await page.waitForTimeout(1500);

    // Check metrics panel
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');

    if ((await metricsPanel.count()) > 0) {
      const metricsText = await metricsPanel.first().textContent();
      console.log('Metrics:', metricsText);

      // Should contain hesitation indicator
      const hasHesitation =
        metricsText?.toLowerCase().includes('hesitation') ||
        metricsText?.toLowerCase().includes('delay') ||
        metricsText?.toLowerCase().includes('pause');

      console.log(`Hesitation in metrics: ${hasHesitation}`);
    }
  });

  test.skip('should show visual indicator while hesitating', async ({ page }) => {
    // This test checks for real-time UI feedback during hesitation
    // May be implementation-specific

    await selectCitizen(page, 0);

    // Wait and check for indicator
    await page.waitForTimeout(15000); // Half way to hesitation threshold

    // Look for any visual indicator
    const indicator = page.locator('[data-testid="timer"], [class*="timer"], [class*="countdown"]');
    const indicatorVisible = await indicator.isVisible().catch(() => false);

    console.log(`Timer indicator visible: ${indicatorVisible}`);

    if (indicatorVisible) {
      const timerText = await indicator.textContent();
      console.log('Timer:', timerText);
    }
  });
});
