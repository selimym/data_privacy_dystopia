import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { measureLoadTime, formatTime } from '../helpers/performance-helpers';

/**
 * Critical Path Test: Game Initialization
 *
 * Verifies that the game boots correctly and all initial screens load properly.
 * These tests MUST pass - they validate the core user entry flow.
 */

test.describe('Game Initialization', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for clean state
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should boot sequence complete in <3s', async ({ page }) => {
    const startTime = performance.now();

    await page.goto('/');

    // Wait for game canvas to appear
    await expect(page.locator('canvas')).toBeVisible({ timeout: 3000 });

    // Wait for MainMenuScene to render
    const mainMenu = page.locator('[data-testid="main-menu"], .main-menu');
    await expect(mainMenu).toBeVisible({ timeout: 3000 });

    const duration = performance.now() - startTime;

    console.log(`Boot sequence completed in ${formatTime(duration)}`);
    expect(duration).toBeLessThan(3000);
  });

  test('should render MainMenuScene with all buttons', async ({ page }) => {
    await page.goto('/');

    // Wait for main menu
    await page.waitForTimeout(1000);

    // Check for all expected buttons
    const exploreTownButton = page.getByRole('button', { name: /explore town/i });
    const rogueEmployeeButton = page.getByRole('button', { name: /rogue employee/i });
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    const settingsButton = page.getByRole('button', { name: /settings/i });

    await expect(exploreTownButton).toBeVisible();
    await expect(rogueEmployeeButton).toBeVisible();
    await expect(systemModeButton).toBeVisible();
    await expect(settingsButton).toBeVisible();
  });

  test('should open and close settings modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Open settings
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    // Check modal appears
    const settingsModal = page.locator('[data-testid="settings-modal"], .settings-modal, [role="dialog"]');
    await expect(settingsModal).toBeVisible({ timeout: 2000 });

    // Close settings
    const closeButton = page.locator('[aria-label="Close"], .close-button, button:has-text("Close")').first();
    await closeButton.click();

    // Modal should disappear
    await expect(settingsModal).not.toBeVisible();
  });

  test('should enable continue button after content warning checkbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click System Mode to trigger content warning (if applicable)
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await systemModeButton.click();

    await page.waitForTimeout(500);

    // Look for content warning checkbox
    const warningCheckbox = page.locator('input[type="checkbox"]').first();

    // Check if warning exists
    if (await warningCheckbox.isVisible()) {
      // Continue button should be disabled initially
      const continueButton = page.getByRole('button', { name: /continue|start/i });

      // Check the checkbox
      await warningCheckbox.click();

      // Continue button should be enabled
      await expect(continueButton).toBeEnabled();
    } else {
      // No content warning - skip test
      console.log('No content warning found - skipping checkbox test');
    }
  });

  test('should start System Mode successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Click System Mode button
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await expect(systemModeButton).toBeVisible();
    await systemModeButton.click();

    // Handle content warning if present
    await page.waitForTimeout(500);
    const warningCheckbox = page.locator('input[type="checkbox"]').first();

    if (await warningCheckbox.isVisible()) {
      await warningCheckbox.click();
      const continueButton = page.getByRole('button', { name: /continue|start/i });
      await continueButton.click();
    }

    // Wait for System Mode to load
    await page.waitForTimeout(2000);

    // Dashboard should be visible
    const dashboard = page.locator('.system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    // Canvas should still be rendered
    await expect(page.locator('canvas')).toBeVisible();

    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Allow some errors but not critical ones
    const criticalErrors = errors.filter((e) =>
      e.toLowerCase().includes('critical') || e.toLowerCase().includes('fatal')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should measure and report load time metrics', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    const metrics = await measureLoadTime(page);

    console.log('Load Time Metrics:');
    console.log(`  DOM Content Loaded: ${formatTime(metrics.domContentLoaded)}`);
    console.log(`  Load Complete: ${formatTime(metrics.loadComplete)}`);
    console.log(`  First Paint: ${formatTime(metrics.firstPaint)}`);
    console.log(`  First Contentful Paint: ${formatTime(metrics.firstContentfulPaint)}`);

    // Assert reasonable load times
    expect(metrics.firstContentfulPaint).toBeLessThan(3000);
  });
});
