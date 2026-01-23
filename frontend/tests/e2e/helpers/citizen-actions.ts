import { Page, expect } from '@playwright/test';

/**
 * Reusable actions for citizen interactions in System Mode.
 * Consolidates common patterns from existing tests.
 */

/**
 * Select a citizen from the dashboard queue
 */
export async function selectCitizen(page: Page, citizenIndex = 0): Promise<void> {
  // Wait for citizen cards to load
  const citizenCards = page.locator('.case-card');
  await expect(citizenCards.first()).toBeVisible({ timeout: 10000 });

  // Click the specified citizen
  const targetCitizen = citizenCards.nth(citizenIndex);
  await expect(targetCitizen).toBeVisible();
  await targetCitizen.click();

  // Wait for citizen file to open
  await page.waitForTimeout(500);
}

/**
 * Flag a citizen with a specific flag type
 */
export async function flagCitizen(
  page: Page,
  flagType: 'monitoring' | 'restriction' | 'intervention' | 'detention',
  justification: string
): Promise<void> {
  // Select flag type from dropdown
  const flagSelect = page.locator('.flag-type-select');
  await expect(flagSelect).toBeVisible({ timeout: 5000 });
  await flagSelect.selectOption(flagType);

  // Wait for button to be enabled
  await page.waitForTimeout(200);

  // Fill in optional justification (not required but good practice)
  const justificationField = page.locator('.decision-justification');
  if (await justificationField.isVisible()) {
    await justificationField.fill(justification);
  }

  // Submit the flag
  const submitButton = page.locator('.btn-submit-flag');
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled({ timeout: 1000 });
  await submitButton.click();

  // Wait for scene transition to WorldScene with cinematic
  await page.waitForTimeout(1500);

  // Wait for cinematic to appear (scene switches to WorldScene)
  const cinematicTextBox = page.locator('.cinematic-text-box');
  try {
    await cinematicTextBox.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[Test] Cinematic appeared, waiting briefly before skipping');
    await page.waitForTimeout(500);

    // Click skip button
    const skipButton = page.locator('.cinematic-skip-button');
    await skipButton.click();
    console.log('[Test] Clicked cinematic skip button');
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('[Test] No cinematic appeared, trying ESC');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Wait for dashboard to return (scene switches back to SystemDashboardScene)
  await expect(page.locator('.system-dashboard')).toBeVisible({ timeout: 10000 });
}

/**
 * Submit a no-action decision
 */
export async function submitNoAction(page: Page, justification: string): Promise<void> {
  // Fill in optional justification first
  const justificationField = page.locator('.decision-justification');
  if (await justificationField.isVisible()) {
    await justificationField.fill(justification);
  }

  // Click no-action button
  const noActionButton = page.locator('.btn-no-action');
  await expect(noActionButton).toBeVisible({ timeout: 5000 });
  await noActionButton.click();

  // Wait for submission to process
  await page.waitForTimeout(1000);
}

/**
 * Wait for week advancement
 */
export async function waitForWeekAdvancement(page: Page): Promise<void> {
  // Wait for either:
  // 1. Cinematic to appear (outcomes screen)
  // 2. Or a reasonable delay if no cinematic

  const cinematic = page.locator('.cinematic-text-box, .outcome-viewer-overlay, .weekly-outcomes');

  try {
    // Try to wait for cinematic to appear (5s timeout)
    await cinematic.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[waitForWeekAdvancement] Cinematic appeared');

    // Immediately skip it to speed up tests
    await page.waitForTimeout(500); // Brief delay for cinematic to fully render
    await skipCinematic(page);
    console.log('[waitForWeekAdvancement] Cinematic skipped');

    // Extra delay for UI to update
    await page.waitForTimeout(1000);
  } catch (e) {
    // No cinematic appeared - just wait a bit for week to update
    console.log('[waitForWeekAdvancement] No cinematic, waiting for week update');
    await page.waitForTimeout(2000);
  }
}

/**
 * Check if citizen file is open
 */
export async function isCitizenFileOpen(page: Page): Promise<boolean> {
  const citizenFile = page.locator('.citizen-file-panel');
  return await citizenFile.isVisible();
}

/**
 * Close citizen file
 */
export async function closeCitizenFile(page: Page): Promise<void> {
  const closeButton = page.locator('.close-citizen-file').first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Switch to a specific tab in citizen file
 */
export async function switchCitizenTab(
  page: Page,
  tabName: 'overview' | 'factors' | 'messages' | 'domains' | 'history'
): Promise<void> {
  const tabDataValue = tabName === 'factors' ? 'factors' : tabName;
  const tab = page.locator(`.citizen-tab[data-tab="${tabDataValue}"]`);
  await expect(tab).toBeVisible();
  await tab.click();
  await page.waitForTimeout(200);
}

/**
 * Get current quota count from UI
 */
export async function getQuotaCount(page: Page): Promise<{ current: number; total: number }> {
  const quotaElement = page.locator('.quota-progress');
  await expect(quotaElement).toBeVisible();

  const text = await quotaElement.textContent();
  const match = text?.match(/(\d+)\s*\/\s*(\d+)/);

  if (!match) {
    throw new Error(`Could not parse quota from text: ${text}`);
  }

  return {
    current: parseInt(match[1], 10),
    total: parseInt(match[2], 10),
  };
}

/**
 * Get current week number from UI
 */
export async function getCurrentWeek(page: Page): Promise<number> {
  const weekElement = page.locator('.directive-week');
  await expect(weekElement).toBeVisible();

  const text = await weekElement.textContent();
  const match = text?.match(/week\s*(\d+)/i);

  if (!match) {
    throw new Error(`Could not parse week from text: ${text}`);
  }

  return parseInt(match[1], 10);
}

/**
 * Wait for cinematic to complete
 */
export async function waitForCinematicComplete(page: Page, timeout = 30000): Promise<void> {
  // Look for cinematic container
  const cinematic = page.locator('.cinematic-text-box');

  // Wait for it to appear
  await expect(cinematic).toBeVisible({ timeout: 5000 });

  // Wait for it to disappear (cinematic complete)
  await expect(cinematic).not.toBeVisible({ timeout });
}

/**
 * Skip cinematic (if skip button exists)
 */
export async function skipCinematic(page: Page): Promise<void> {
  // Try cinematic skip button
  const skipButton = page.locator('.cinematic-skip-button');

  if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
    return;
  }

  // Try outcome viewer close button
  const closeButton = page.locator('.btn-close-viewer');

  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(500);
    return;
  }

  // Try decision result modal return button
  const returnButton = page.locator('.btn-return');

  if (await returnButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await returnButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Complete a full week (submit flags until quota met)
 */
export async function completeWeek(
  page: Page,
  flagType: 'monitoring' | 'restriction' | 'intervention' | 'detention' = 'monitoring'
): Promise<void> {
  const quota = await getQuotaCount(page);
  const flagsNeeded = quota.total - quota.current;

  for (let i = 0; i < flagsNeeded; i++) {
    await selectCitizen(page, 0);
    await flagCitizen(page, flagType, `Test flag ${i + 1}`);
    await page.waitForTimeout(1000);
  }

  // Wait for week to advance
  await waitForWeekAdvancement(page);
}
