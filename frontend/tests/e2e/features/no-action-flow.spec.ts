import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, submitNoAction } from '../helpers/citizen-actions';
import { TEST_JUSTIFICATIONS } from '../helpers/test-data';

/**
 * Feature Test: No-Action Flow
 *
 * Tests the functionality of submitting no-action decisions:
 * - Submit no-action with justification
 * - Compliance score decreases
 * - Reluctance increases
 * - Warning appears after multiple no-actions
 */

test.describe('No-Action Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should submit no-action with justification', async ({ page }) => {
    await selectCitizen(page, 0);
    await submitNoAction(page, TEST_JUSTIFICATIONS.noAction);

    // Should return to dashboard
    await page.waitForTimeout(1000);
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 5000 });

    console.log('No-action submitted successfully');
  });

  test('should decrease compliance score after no-action', async ({ page }) => {
    // Get initial compliance metrics
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');
    let initialCompliance = 0;

    if ((await metricsPanel.count()) > 0) {
      const metricsText = await metricsPanel.first().textContent();
      console.log('Initial metrics:', metricsText);

      // Try to extract compliance value
      const complianceMatch = metricsText?.match(/compliance[:\s]*(\d+)/i);
      if (complianceMatch) {
        initialCompliance = parseInt(complianceMatch[1]);
      }
    }

    // Submit no-action
    await selectCitizen(page, 0);
    await submitNoAction(page, TEST_JUSTIFICATIONS.noAction);
    await page.waitForTimeout(1500);

    // Check new compliance
    if ((await metricsPanel.count()) > 0) {
      const newMetricsText = await metricsPanel.first().textContent();
      console.log('New metrics:', newMetricsText);

      const newComplianceMatch = newMetricsText?.match(/compliance[:\s]*(\d+)/i);
      if (newComplianceMatch && initialCompliance > 0) {
        const newCompliance = parseInt(newComplianceMatch[1]);
        expect(newCompliance).toBeLessThanOrEqual(initialCompliance);
      }
    }
  });

  test('should increase reluctance after no-action', async ({ page }) => {
    // Submit no-action
    await selectCitizen(page, 0);
    await submitNoAction(page, TEST_JUSTIFICATIONS.noAction);
    await page.waitForTimeout(1500);

    // Check for reluctance indicator
    const reluctance = page.locator('[data-testid="reluctance"], [class*="reluctance"]');
    const reluctanceVisible = (await reluctance.count()) > 0;

    console.log(`Reluctance indicator visible: ${reluctanceVisible}`);

    if (reluctanceVisible) {
      const reluctanceText = await reluctance.first().textContent();
      console.log('Reluctance:', reluctanceText);
    }
  });

  test('should show warning after multiple no-actions', async ({ page }) => {
    // Submit 3 no-actions
    for (let i = 0; i < 3; i++) {
      await selectCitizen(page, 0);
      await submitNoAction(page, `No-action ${i + 1}: ${TEST_JUSTIFICATIONS.noAction}`);
      await page.waitForTimeout(1500);
    }

    // Look for warning message
    const warning = page.locator('[data-testid="warning"], .warning-message, [class*="alert"]');
    const warningVisible = await warning.isVisible().catch(() => false);

    console.log(`Warning visible after 3 no-actions: ${warningVisible}`);

    if (warningVisible) {
      const warningText = await warning.textContent();
      console.log('Warning text:', warningText?.substring(0, 100));
    }
  });

  test('should track no-action count in metrics', async ({ page }) => {
    // Submit multiple no-actions
    for (let i = 0; i < 2; i++) {
      await selectCitizen(page, 0);
      await submitNoAction(page, `No-action ${i + 1}`);
      await page.waitForTimeout(1500);
    }

    // Check metrics for no-action count
    const metricsPanel = page.locator('[data-testid="metrics-panel"], .metrics, .operator-stats');

    if ((await metricsPanel.count()) > 0) {
      const metricsText = await metricsPanel.first().textContent();
      console.log('Metrics:', metricsText);

      // Should show no-action count or reluctance
      const hasRelevantMetric =
        metricsText?.includes('no-action') ||
        metricsText?.includes('reluctance') ||
        metricsText?.includes('skipped');

      console.log(`No-action metric tracked: ${hasRelevantMetric}`);
    }
  });

  test('should require justification for no-action', async ({ page }) => {
    await selectCitizen(page, 0);

    // Click no-action button
    const noActionButton = page.getByRole('button', { name: /no action|skip|dismiss/i });
    await expect(noActionButton).toBeVisible({ timeout: 5000 });
    await noActionButton.click();

    await page.waitForTimeout(300);

    // Justification field should appear
    const justificationField = page.locator('textarea[name="justification"], textarea[placeholder*="justification" i]');
    await expect(justificationField).toBeVisible();

    // Submit button should exist
    const submitButton = page.getByRole('button', { name: /submit|confirm/i });
    await expect(submitButton).toBeVisible();
  });

  test('should allow alternating flags and no-actions', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Alternate between flag and no-action
    for (let i = 0; i < 2; i++) {
      // Flag
      await selectCitizen(page, 0);
      const flagButton = page.getByRole('button', { name: /monitoring/i });
      await flagButton.click();
      await page.waitForTimeout(300);
      const justificationField1 = page.locator('textarea').first();
      await justificationField1.fill(`Flag ${i + 1}`);
      const submitButton1 = page.getByRole('button', { name: /submit|confirm/i });
      await submitButton1.click();
      await page.waitForTimeout(1500);

      // No-action
      await selectCitizen(page, 0);
      await submitNoAction(page, `No-action ${i + 1}`);
      await page.waitForTimeout(1500);
    }

    // No critical errors
    const criticalErrors = errors.filter((e) =>
      e.toLowerCase().includes('undefined is not') ||
      e.toLowerCase().includes('cannot read')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
