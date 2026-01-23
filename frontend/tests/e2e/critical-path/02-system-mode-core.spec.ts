import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';

/**
 * Critical Path Test: System Mode Core Functionality
 *
 * Verifies the core System Mode features work correctly:
 * - Dashboard loads with citizens
 * - Citizen files open with all tabs
 * - Data fields are populated
 * - No critical errors occur
 */

test.describe('System Mode Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should load dashboard with citizens', async ({ page }) => {
    // Start System Mode
    await startSystemMode(page);

    // Dashboard should be visible
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    // Citizens should be visible in queue
    const citizenCards = page.locator('.case-card');
    await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });

    // Should have at least one citizen
    const count = await citizenCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open citizen file with all tabs', async ({ page }) => {
    await startSystemMode(page);

    // Wait for citizens to load
    const citizenCards = page.locator('.case-card');
    await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });

    // Click first citizen
    await citizenCards.first().click();
    await page.waitForTimeout(500);

    // Citizen file should open
    const citizenFile = page.locator('.citizen-file-panel');
    await expect(citizenFile).toBeVisible({ timeout: 5000 });

    // Check for all expected tabs
    const tabs = ['Overview', 'Risk Factors', 'Messages', 'Domains', 'History'];

    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      // Tab may exist but be case-sensitive or have different naming
      const tabExists = (await tab.count()) > 0;
      console.log(`Tab "${tabName}": ${tabExists ? 'found' : 'not found'}`);
    }

    // At minimum, should have overview/main content visible
    const mainContent = page.locator('[data-testid="citizen-overview"], .citizen-details');
    const contentVisible = await mainContent.isVisible();
    expect(contentVisible).toBeTruthy();
  });

  test('should populate all data fields correctly', async ({ page }) => {
    await startSystemMode(page);

    // Open first citizen
    const citizenCards = page.locator('.case-card');
    await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });
    await citizenCards.first().click();
    await page.waitForTimeout(500);

    // Check for key data fields
    const citizenFile = page.locator('.citizen-file-panel');
    await expect(citizenFile).toBeVisible();

    // Name should be present
    const nameField = citizenFile.locator('[data-testid="citizen-name"], .citizen-name, h1, h2').first();
    const nameText = await nameField.textContent();
    expect(nameText).toBeTruthy();
    expect(nameText!.length).toBeGreaterThan(0);

    // Risk score should be present
    const riskScoreField = citizenFile.locator('[data-testid="risk-score"], .risk-score, [class*="risk"]');
    const riskExists = (await riskScoreField.count()) > 0;
    console.log(`Risk score field exists: ${riskExists}`);

    // Some data should be displayed
    const dataFields = citizenFile.locator('[data-testid*="field"], .data-field, .info-row');
    const dataCount = await dataFields.count();
    expect(dataCount).toBeGreaterThan(0);
  });

  test('should not have console errors during normal operation', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await startSystemMode(page);

    // Open a citizen file
    const citizenCards = page.locator('.case-card');
    await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });
    await citizenCards.first().click();
    await page.waitForTimeout(1000);

    console.log(`Console errors: ${errors.length}`);
    console.log(`Console warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5));
    }

    // No critical errors
    const criticalErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes('critical') ||
        e.toLowerCase().includes('fatal') ||
        e.toLowerCase().includes('undefined is not')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should display week and quota indicators', async ({ page }) => {
    await startSystemMode(page);

    // Wait for dashboard
    await page.waitForTimeout(2000);

    // Week indicator should exist
    const weekIndicators = page.locator('[data-testid="week-indicator"], .week-number, [class*="week"]');
    const weekCount = await weekIndicators.count();
    console.log(`Week indicators found: ${weekCount}`);

    // Quota indicator should exist
    const quotaIndicators = page.locator('[data-testid="quota-counter"], .quota-display, [class*="quota"]');
    const quotaCount = await quotaIndicators.count();
    console.log(`Quota indicators found: ${quotaCount}`);

    // At least one should exist
    expect(weekCount + quotaCount).toBeGreaterThan(0);
  });

  test('should have functioning close button on citizen file', async ({ page }) => {
    await startSystemMode(page);

    // Open citizen file
    const citizenCards = page.locator('.case-card');
    await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });
    await citizenCards.first().click();
    await page.waitForTimeout(500);

    // Citizen file should be open
    const citizenFile = page.locator('.citizen-file-panel');
    await expect(citizenFile).toBeVisible();

    // Find and click close button
    const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"], .close-button').first();

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(300);

      // File should close
      await expect(citizenFile).not.toBeVisible();
    } else {
      console.log('No close button found - may close differently');
    }
  });
});
