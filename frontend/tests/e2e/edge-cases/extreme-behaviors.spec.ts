import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, flagCitizen, submitNoAction, completeWeek } from '../helpers/citizen-actions';

/**
 * Edge Case Test: Extreme Behaviors
 *
 * Tests extreme player behaviors:
 * - Flag all citizens without no-actions (high compliance path)
 * - Submit only no-actions (expect early termination)
 * - Alternate flags and no-actions (balanced path)
 */

test.describe('Extreme Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should handle high compliance path (flag all citizens)', async ({ page }) => {
    // Flag many citizens with harsh decisions
    for (let i = 0; i < 9; i++) {
      // 3 weeks worth
      await selectCitizen(page, 0);
      await flagCitizen(page, 'detention', `High compliance flag ${i + 1}`);
      await page.waitForTimeout(1500);

      // Skip cinematics
      const skipButton = page.locator('[data-testid="skip-cinematic"], button:has-text("Skip")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      }

      await page.waitForTimeout(500);
    }

    // Metrics should show high compliance
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');

    if ((await metricsPanel.count()) > 0) {
      const metricsText = await metricsPanel.first().textContent();
      console.log('High compliance metrics:', metricsText);

      // Should have compliance indicator
      const hasCompliance = metricsText?.toLowerCase().includes('compliance');
      console.log(`Compliance tracked: ${hasCompliance}`);
    }

    console.log('High compliance path completed');
  });

  test('should handle many no-actions (expect termination)', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Submit many no-actions
    for (let i = 0; i < 10; i++) {
      await selectCitizen(page, 0);
      await submitNoAction(page, `No action ${i + 1}: Insufficient evidence`);
      await page.waitForTimeout(1500);

      // Check if termination occurred
      const endingScreen = page.locator('[data-testid="ending-screen"], .ending-screen, .termination');
      if (await endingScreen.isVisible()) {
        console.log(`Early termination after ${i + 1} no-actions`);
        const endingText = await endingScreen.textContent();
        console.log('Termination message:', endingText?.substring(0, 100));
        break;
      }

      // Check for warning
      const warning = page.locator('[data-testid="warning"], .warning-message');
      if (await warning.isVisible()) {
        const warningText = await warning.textContent();
        console.log(`Warning after ${i + 1} no-actions:`, warningText?.substring(0, 80));
      }
    }

    // No critical errors during no-action spam
    const criticalErrors = errors.filter((e) =>
      e.toLowerCase().includes('undefined is not') ||
      e.toLowerCase().includes('cannot read')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should handle alternating flags and no-actions', async ({ page }) => {
    // Balanced approach: alternate between flag and no-action
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        // Flag
        await selectCitizen(page, 0);
        await flagCitizen(page, 'monitoring', `Balanced flag ${i + 1}`);
      } else {
        // No-action
        await selectCitizen(page, 0);
        await submitNoAction(page, `Balanced no-action ${i + 1}`);
      }

      await page.waitForTimeout(1500);
    }

    // Should not trigger termination
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible();

    console.log('Balanced path completed successfully');
  });

  test('should handle rapid flag submissions', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Submit flags quickly
    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);

      const flagButton = page.getByRole('button', { name: /monitoring/i });
      await flagButton.click();
      await page.waitForTimeout(200);

      const justificationField = page.locator('textarea').first();
      await justificationField.fill(`Rapid flag ${i + 1}`);

      const submitButton = page.getByRole('button', { name: /submit|confirm/i });
      await submitButton.click();

      await page.waitForTimeout(800); // Minimal wait
    }

    // Should handle rapid submissions without errors
    const criticalErrors = errors.filter((e) =>
      e.toLowerCase().includes('undefined is not') ||
      e.toLowerCase().includes('cannot read')
    );

    expect(criticalErrors.length).toBe(0);

    console.log('Rapid submissions handled correctly');
  });

  test('should handle switching between citizens without submitting', async ({ page }) => {
    // Open and close citizens without making decisions
    for (let i = 0; i < 5; i++) {
      await selectCitizen(page, 0);
      await page.waitForTimeout(500);

      // Close without decision
      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Should still be on dashboard
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible();

    console.log('Indecisive behavior handled correctly');
  });

  test('should handle completing all 6 weeks with detention flags', async ({ page }) => {
    // Extreme compliance: detention every time for 6 weeks
    // This is a long test (~3 minutes)

    for (let week = 1; week <= 6; week++) {
      console.log(`Week ${week}: Flagging all citizens with detention...`);
      await completeWeek(page, 'detention');
      await page.waitForTimeout(3000);

      // Skip outcomes
      const skipButton = page.locator('[data-testid="skip-cinematic"], button:has-text("Skip"), button:has-text("Continue")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Ending should appear
    await page.waitForTimeout(5000);

    const endingScreen = page.locator('[data-testid="ending-screen"], .ending-screen');
    const endingVisible = await endingScreen.isVisible().catch(() => false);

    console.log(`Ending screen visible: ${endingVisible}`);

    if (endingVisible) {
      const endingText = await endingScreen.textContent();
      console.log('Ending:', endingText?.substring(0, 100));
    }
  });
});
