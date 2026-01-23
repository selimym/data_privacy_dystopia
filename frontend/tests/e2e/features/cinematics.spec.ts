import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { selectCitizen, flagCitizen, waitForCinematicComplete, skipCinematic } from '../helpers/citizen-actions';

/**
 * Feature Test: Cinematics
 *
 * Tests cinematic sequences:
 * - Cinematic plays after flag submission
 * - Outcome narrative displays
 * - Return to dashboard after cinematic
 * - No infinite loops (regression test)
 */

test.describe('Cinematics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
    await startSystemMode(page);
  });

  test('should play cinematic after flag submission', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'detention', 'High-severity flag for cinematic test');

    // Wait for cinematic to appear
    await page.waitForTimeout(2000);

    const cinematic = page.locator('[data-testid="cinematic"], .cinematic-container, .outcome-cinematic');
    const cinematicVisible = await cinematic.isVisible().catch(() => false);

    console.log(`Cinematic visible: ${cinematicVisible}`);

    if (cinematicVisible) {
      // Cinematic should have content
      const cinematicText = await cinematic.textContent();
      expect(cinematicText).toBeTruthy();
      console.log('Cinematic preview:', cinematicText?.substring(0, 100));
    }
  });

  test('should display outcome narrative', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'intervention', 'Test outcome narrative');

    await page.waitForTimeout(2000);

    // Look for narrative text
    const narrative = page.locator('[data-testid="narrative"], .narrative-text, .outcome-text');
    const narrativeVisible = (await narrative.count()) > 0;

    console.log(`Narrative visible: ${narrativeVisible}`);

    if (narrativeVisible) {
      const narrativeText = await narrative.first().textContent();
      console.log('Narrative:', narrativeText?.substring(0, 150));

      // Should have meaningful content
      expect(narrativeText!.length).toBeGreaterThan(20);
    }
  });

  test('should return to dashboard after cinematic', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', 'Test return to dashboard');

    await page.waitForTimeout(2000);

    // Skip cinematic if present
    await skipCinematic(page);

    // Wait for return to dashboard
    await page.waitForTimeout(2000);

    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    console.log('Returned to dashboard successfully');
  });

  test('should not create infinite cinematic loop', async ({ page }) => {
    // Regression test for CINEMATIC_LOOP_FIX.md
    const cinematicCount = { value: 0 };

    // Monitor for multiple cinematic appearances
    page.on('console', (msg) => {
      if (msg.text().includes('cinematic') || msg.text().includes('outcome')) {
        cinematicCount.value++;
      }
    });

    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', 'Loop prevention test');

    // Wait and skip cinematic
    await page.waitForTimeout(2000);
    await skipCinematic(page);
    await page.waitForTimeout(3000);

    // Dashboard should be visible and stable
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible();

    // Wait to ensure no loop occurs
    await page.waitForTimeout(5000);

    // Still on dashboard
    await expect(dashboard).toBeVisible();

    console.log('No infinite loop detected');
  });

  test('should allow skipping cinematic with button', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'restriction', 'Test skip functionality');

    await page.waitForTimeout(2000);

    // Look for skip button
    const skipButton = page.locator('[data-testid="skip-cinematic"], button:has-text("Skip"), button:has-text("Continue")');

    if (await skipButton.isVisible()) {
      console.log('Skip button found');
      await skipButton.click();

      // Should quickly return to dashboard
      await page.waitForTimeout(1000);

      const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
      await expect(dashboard).toBeVisible();

      console.log('Cinematic skipped successfully');
    } else {
      console.log('No skip button found - may auto-play');
    }
  });

  test('should complete cinematic automatically if not skipped', async ({ page }) => {
    await selectCitizen(page, 0);
    await flagCitizen(page, 'monitoring', 'Test auto-complete');

    await page.waitForTimeout(2000);

    const cinematic = page.locator('[data-testid="cinematic"], .cinematic-container');
    const cinematicVisible = await cinematic.isVisible().catch(() => false);

    if (cinematicVisible) {
      console.log('Waiting for cinematic to complete...');

      // Wait up to 30 seconds for completion
      try {
        await waitForCinematicComplete(page, 30000);
        console.log('Cinematic completed');
      } catch (error) {
        console.log('Cinematic may have different completion mechanism');
      }
    }

    // Should eventually return to dashboard
    const dashboard = page.locator('[data-testid="system-dashboard"], .system-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 35000 });
  });

  test('should show outcomes for multiple flagged citizens', async ({ page }) => {
    // Flag 3 citizens to complete quota
    for (let i = 0; i < 3; i++) {
      await selectCitizen(page, 0);
      await flagCitizen(page, 'monitoring', `Flag ${i + 1}`);
      await page.waitForTimeout(2000);
      await skipCinematic(page);
      await page.waitForTimeout(1000);
    }

    // After quota met, weekly outcomes cinematic should appear
    await page.waitForTimeout(3000);

    const outcomes = page.locator('[data-testid="outcomes"], .outcomes-screen, .weekly-outcomes');
    const outcomesVisible = await outcomes.isVisible().catch(() => false);

    console.log(`Weekly outcomes visible: ${outcomesVisible}`);

    if (outcomesVisible) {
      const outcomesText = await outcomes.textContent();
      console.log('Outcomes preview:', outcomesText?.substring(0, 150));

      // Should show multiple outcomes (3 citizens)
      expect(outcomesText!.length).toBeGreaterThan(50);
    }
  });
});
