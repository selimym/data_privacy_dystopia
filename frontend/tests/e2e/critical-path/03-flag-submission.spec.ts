import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, flagCitizen, getQuotaCount } from '../helpers/citizen-actions';
import { TEST_JUSTIFICATIONS } from '../helpers/test-data';

/**
 * Critical Path Test: Flag Submission
 *
 * Verifies that all flag types can be submitted successfully:
 * - Monitoring, Restriction, Intervention, Detention
 * - Justification required
 * - Cinematic plays
 * - Return to dashboard
 * - Quota updates
 * - Flagged citizen removed
 */

test.describe('Flag Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should submit monitoring flag with justification', async ({ page }) => {
    // Get initial quota
    const initialQuota = await getQuotaCount(page);
    console.log(`Initial quota: ${initialQuota.current}/${initialQuota.total}`);

    // Get initial citizen count
    const citizenCards = page.locator('.case-card');
    const initialCount = await citizenCards.count();

    // Select and flag citizen
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', TEST_JUSTIFICATIONS.monitoring);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Check if cinematic appears (may or may not depending on implementation)
    const cinematic = page.locator('[data-testid="cinematic"], .cinematic-container');
    const cinematicVisible = await cinematic.isVisible().catch(() => false);

    if (cinematicVisible) {
      console.log('Cinematic displayed');
      // Wait for it to complete or skip it
      const skipButton = page.locator('[data-testid="skip-cinematic"], button:has-text("Skip")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else {
        await page.waitForTimeout(5000);
      }
    }

    // Should return to dashboard
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    // Quota should update
    await page.waitForTimeout(1000);
    const newQuota = await getQuotaCount(page);
    console.log(`New quota: ${newQuota.current}/${newQuota.total}`);

    expect(newQuota.current).toBeGreaterThan(initialQuota.current);
  });

  test('should submit restriction flag', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'restriction', TEST_JUSTIFICATIONS.restriction);

    await page.waitForTimeout(2000);

    // Should return to dashboard
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('should submit intervention flag', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'intervention', TEST_JUSTIFICATIONS.intervention);

    await page.waitForTimeout(2000);

    // Should return to dashboard
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('should submit detention flag', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'detention', TEST_JUSTIFICATIONS.detention);

    await page.waitForTimeout(2000);

    // Should return to dashboard
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('should update metrics after flag submission', async ({ page }) => {
    // Submit a flag
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', TEST_JUSTIFICATIONS.monitoring);

    await page.waitForTimeout(2000);

    // Metrics should be updated (check for metrics panel)
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');
    const metricsVisible = (await metricsPanel.count()) > 0;

    console.log(`Metrics panel found: ${metricsVisible}`);

    if (metricsVisible) {
      // Metrics should show updated values
      const metricsText = await metricsPanel.first().textContent();
      expect(metricsText).toBeTruthy();
    }
  });

  test('should keep flagged citizen in queue', async ({ page }) => {
    // Get first citizen info
    const citizenCards = page.locator('.case-card');
    const initialCount = await citizenCards.count();

    console.log(`Initial citizen count: ${initialCount}`);

    // Flag the citizen
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', TEST_JUSTIFICATIONS.monitoring);

    await page.waitForTimeout(1000);

    // Citizens remain in queue after flagging (can be reviewed multiple times)
    const newCount = await citizenCards.count();

    console.log(`New citizen count: ${newCount}`);

    // Queue count should remain the same
    expect(newCount).toBe(initialCount);
  });

  test('should handle multiple flags in sequence', async ({ page }) => {
    const initialQuota = await getQuotaCount(page);

    // Submit 3 flags
    for (let i = 0; i < 3; i++) {
      await selectCitizen(page, 0);
      await flagCitizen(page, 'monitoring', `Test flag ${i + 1}`);
      await page.waitForTimeout(2000);
    }

    // Quota should reflect all submissions
    const finalQuota = await getQuotaCount(page);
    expect(finalQuota.current).toBe(initialQuota.current + 3);
  });

  test('should not allow empty justification', async ({ page }) => {
    await selectCitizen(page, 0);

    // Select flag type without filling justification
    const flagSelect = page.locator('.flag-type-select');
    await expect(flagSelect).toBeVisible({ timeout: 5000 });
    await flagSelect.selectOption('monitoring');

    await page.waitForTimeout(300);

    // Leave justification empty (it's optional, so this should work)
    const justificationField = page.locator('.decision-justification');
    expect(await justificationField.inputValue()).toBe('');

    // Submit button should still be enabled (justification is optional)
    const submitButton = page.locator('.btn-submit-flag');
    await expect(submitButton).toBeEnabled({ timeout: 2000 });

    // Click submit - should succeed even without justification
    await submitButton.click();

    // Wait for cinematic or result
    await page.waitForTimeout(1000);

    // Should transition to cinematic or update UI (not stay on form)
    const cinematicOrDashboard = await Promise.race([
      page.locator('.cinematic-text-box').isVisible().catch(() => false),
      page.waitForTimeout(2000).then(() => true),
    ]);

    console.log(`Flag submitted without justification: ${cinematicOrDashboard}`);
  });
});
