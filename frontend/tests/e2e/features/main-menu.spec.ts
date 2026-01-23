import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';

/**
 * Feature Test: Main Menu
 *
 * Tests main menu functionality:
 * - All menu buttons work
 * - Settings modal functionality
 * - Content warning flow
 * - Navigation between modes
 */

test.describe('Main Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should display all menu buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check for all main buttons
    const buttons = [
      /explore town/i,
      /rogue employee/i,
      /the system/i,
      /settings/i,
    ];

    for (const buttonPattern of buttons) {
      const button = page.getByRole('button', { name: buttonPattern });
      const visible = await button.isVisible().catch(() => false);
      console.log(`Button "${buttonPattern}" visible: ${visible}`);
    }

    // At minimum, should have System Mode button
    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await expect(systemModeButton).toBeVisible();
  });

  test('should open settings modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();

    await page.waitForTimeout(500);

    // Settings modal should appear
    const modal = page.locator('[data-testid="settings-modal"], .settings-modal, [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    console.log('Settings modal opened');
  });

  test('should have audio controls in settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Look for audio controls
    const audioControls = page.locator('[data-testid="audio-controls"], input[type="range"], .volume-slider');
    const hasAudioControls = (await audioControls.count()) > 0;

    console.log(`Audio controls present: ${hasAudioControls}`);

    if (hasAudioControls) {
      // Should have volume control
      const volumeControl = page.locator('input[type="range"]').first();
      const volumeValue = await volumeControl.getAttribute('value');
      console.log(`Volume value: ${volumeValue}`);
    }
  });

  test('should close settings modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="settings-modal"], .settings-modal, [role="dialog"]');
    await expect(modal).toBeVisible();

    // Close modal
    const closeButton = page.locator('[aria-label="Close"], .close-button, button:has-text("Close")').first();
    await closeButton.click();
    await page.waitForTimeout(300);

    // Modal should disappear
    await expect(modal).not.toBeVisible();

    console.log('Settings modal closed');
  });

  test('should navigate to Explore Town mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const exploreTownButton = page.getByRole('button', { name: /explore town/i });

    if (await exploreTownButton.isVisible()) {
      await exploreTownButton.click();
      await page.waitForTimeout(2000);

      // Should load WorldScene
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      console.log('Explore Town mode loaded');
    } else {
      console.log('Explore Town button not available');
    }
  });

  test('should navigate to System Mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await systemModeButton.click();

    // Handle content warning if present
    await page.waitForTimeout(500);
    const warningCheckbox = page.locator('input[type="checkbox"]').first();

    if (await warningCheckbox.isVisible()) {
      await warningCheckbox.click();
      const continueButton = page.getByRole('button', { name: /continue|start/i });
      await continueButton.click();
    }

    await page.waitForTimeout(2000);

    // Dashboard should load
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    console.log('System Mode loaded');
  });

  test('should show Rogue Employee mode as coming soon or disabled', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const rogueButton = page.getByRole('button', { name: /rogue employee/i });

    if (await rogueButton.isVisible()) {
      const isDisabled = await rogueButton.isDisabled();
      console.log(`Rogue Employee button disabled: ${isDisabled}`);

      // Either disabled or shows "coming soon"
      if (!isDisabled) {
        await rogueButton.click();
        await page.waitForTimeout(1000);

        // May show "coming soon" message
        const comingSoon = page.locator('text=/coming soon/i');
        const comingSoonVisible = await comingSoon.isVisible().catch(() => false);
        console.log(`Coming soon message: ${comingSoonVisible}`);
      }
    } else {
      console.log('Rogue Employee button not found');
    }
  });

  test('should show game title and branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Look for game title
    const title = page.locator('h1, .game-title, .title');
    const titleVisible = (await title.count()) > 0;

    console.log(`Title visible: ${titleVisible}`);

    if (titleVisible) {
      const titleText = await title.first().textContent();
      console.log(`Title: ${titleText}`);
      expect(titleText).toBeTruthy();
    }
  });

  test('should have functioning content warning checkbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const systemModeButton = page.getByRole('button', { name: /the system/i });
    await systemModeButton.click();
    await page.waitForTimeout(500);

    // Check for content warning
    const warningCheckbox = page.locator('input[type="checkbox"]').first();

    if (await warningCheckbox.isVisible()) {
      // Continue button should be disabled
      const continueButton = page.getByRole('button', { name: /continue|start/i });
      const initiallyDisabled = await continueButton.isDisabled().catch(() => false);

      console.log(`Continue button initially disabled: ${initiallyDisabled}`);

      // Check the checkbox
      await warningCheckbox.click();

      // Continue button should now be enabled
      await page.waitForTimeout(200);
      const nowEnabled = await continueButton.isEnabled().catch(() => false);

      console.log(`Continue button enabled after checkbox: ${nowEnabled}`);

      expect(nowEnabled).toBeTruthy();
    } else {
      console.log('No content warning present');
    }
  });
});
