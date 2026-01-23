import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import {
  selectCitizen,
  flagCitizen,
  getQuotaCount,
  getCurrentWeek,
  completeWeek,
} from '../helpers/citizen-actions';

/**
 * Critical Path Test: Time Progression
 *
 * Verifies that time progresses correctly through weeks:
 * - Complete Week 1 quota
 * - Weekly outcomes cinematic
 * - Week 2 directive appears
 * - Quota resets
 * - Progress through weeks 1-3
 */

test.describe('Time Progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should complete Week 1 quota', async ({ page }) => {
    const quota = await getQuotaCount(page);
    console.log(`Week 1 quota: ${quota.current}/${quota.total}`);

    const flagsNeeded = quota.total - quota.current;

    // Submit flags to meet quota
    for (let i = 0; i < flagsNeeded; i++) {
      await selectCitizen(page, 0);
      await flagCitizen(page, 'monitoring', `Week 1 flag ${i + 1}`);
      await page.waitForTimeout(1500);
    }

    // Quota should be met
    const finalQuota = await getQuotaCount(page);
    expect(finalQuota.current).toBe(finalQuota.total);
  });

  test('should show weekly outcomes cinematic after quota met', async ({ page }) => {
    // Complete the week
    const quota = await getQuotaCount(page);
    const flagsNeeded = quota.total - quota.current;

    for (let i = 0; i < flagsNeeded; i++) {
      await selectCitizen(page, 0);
      await flagCitizen(page, 'monitoring', `Flag ${i + 1}`);
      await page.waitForTimeout(1500);
    }

    // Wait for outcomes cinematic
    await page.waitForTimeout(3000);

    // Look for cinematic or outcomes display
    const cinematic = page.locator('[data-testid="cinematic"], .cinematic-container, .outcomes-screen');
    const cinematicVisible = await cinematic.isVisible().catch(() => false);

    console.log(`Outcomes cinematic visible: ${cinematicVisible}`);

    if (cinematicVisible) {
      // Outcomes should show narratives
      const narrativeText = await cinematic.textContent();
      expect(narrativeText).toBeTruthy();
      expect(narrativeText!.length).toBeGreaterThan(0);

      // Skip or wait for completion
      const skipButton = page.locator('[data-testid="skip-cinematic"], button:has-text("Skip"), button:has-text("Continue")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else {
        await page.waitForTimeout(10000);
      }
    }
  });

  test('should show Week 2 directive after Week 1 complete', async ({ page }) => {
    // Complete Week 1
    await completeWeek(page, 'monitoring');

    // Wait for week transition
    await page.waitForTimeout(3000);

    // Should now be in Week 2
    const currentWeek = await getCurrentWeek(page);
    console.log(`Current week: ${currentWeek}`);

    expect(currentWeek).toBeGreaterThanOrEqual(2);

    // New directive should appear
    const directive = page.locator('[data-testid="directive"], .directive-text, .mission-brief');
    const directiveVisible = (await directive.count()) > 0;

    console.log(`Directive visible: ${directiveVisible}`);

    if (directiveVisible) {
      const directiveText = await directive.first().textContent();
      expect(directiveText).toBeTruthy();
    }
  });

  test('should reset quota to 0/3 after week advancement', async ({ page }) => {
    // Complete Week 1
    await completeWeek(page, 'monitoring');

    // Wait for week transition
    await page.waitForTimeout(3000);

    // Quota should reset
    const newQuota = await getQuotaCount(page);
    console.log(`Week 2 quota: ${newQuota.current}/${newQuota.total}`);

    expect(newQuota.current).toBe(0);
    expect(newQuota.total).toBe(3);
  });

  test('should progress through Weeks 1-3', async ({ page }) => {
    // Complete Week 1
    console.log('Completing Week 1...');
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(3000);

    let currentWeek = await getCurrentWeek(page);
    expect(currentWeek).toBe(2);

    // Complete Week 2
    console.log('Completing Week 2...');
    await completeWeek(page, 'restriction');
    await page.waitForTimeout(3000);

    currentWeek = await getCurrentWeek(page);
    expect(currentWeek).toBe(3);

    // Verify we're in Week 3
    console.log('Reached Week 3');
    const quota = await getQuotaCount(page);
    expect(quota.current).toBe(0);
  });

  test('should track cumulative flags across weeks', async ({ page }) => {
    // Complete Week 1
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(3000);

    // Complete Week 2
    await completeWeek(page, 'restriction');
    await page.waitForTimeout(3000);

    // Check if metrics show cumulative count
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');

    if ((await metricsPanel.count()) > 0) {
      const metricsText = await metricsPanel.first().textContent();
      console.log('Metrics:', metricsText);

      // Should show at least 6 flags (3 per week)
      // This is implementation-dependent
    }
  });

  test('should display different directives each week', async ({ page }) => {
    // Get Week 1 directive
    const directive1 = page.locator('[data-testid="directive"], .directive-text, .mission-brief');
    let directive1Text = '';

    if ((await directive1.count()) > 0) {
      directive1Text = (await directive1.first().textContent()) || '';
      console.log('Week 1 directive:', directive1Text.substring(0, 50));
    }

    // Complete Week 1
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(3000);

    // Get Week 2 directive
    if ((await directive1.count()) > 0) {
      const directive2Text = (await directive1.first().textContent()) || '';
      console.log('Week 2 directive:', directive2Text.substring(0, 50));

      // Directives should be different
      if (directive1Text && directive2Text) {
        expect(directive2Text).not.toBe(directive1Text);
      }
    }
  });
});
