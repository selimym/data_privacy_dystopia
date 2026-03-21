/**
 * Helper utilities for storage and state management during tests.
 *
 * NOTE: This is a fat client application - all game logic runs in the browser.
 * No backend API calls are needed. Use indexeddb-helpers.ts for storage operations.
 */

import { Page } from '@playwright/test';

/**
 * Wait for game to initialize
 */
export async function waitForGameInit(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('canvas', { timeout });
  await page.waitForTimeout(1000);
}

/**
 * Check if game is in test mode
 */
export async function isTestMode(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return localStorage.getItem('test_mode') === 'true';
  });
}

/**
 * Enable test mode
 */
export async function enableTestMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('test_mode', 'true');
  });
}

/**
 * Disable test mode
 */
export async function disableTestMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('test_mode');
  });
}
