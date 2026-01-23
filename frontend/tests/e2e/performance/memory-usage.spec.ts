import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { completeWeek } from '../helpers/citizen-actions';
import { getMemoryUsage, formatBytes } from '../helpers/performance-helpers';

/**
 * Performance Test: Memory Usage
 *
 * Measures memory consumption during gameplay:
 * - Initial memory footprint
 * - Memory after loading citizens
 * - Memory after multiple weeks
 * - Assert <100MB total usage
 *
 * Note: performance.memory is Chrome-specific
 */

test.describe('Memory Usage Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should measure initial memory footprint', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      console.log('Memory tests only work in Chromium');
      return;
    }

    await page.goto('/');
    await page.waitForTimeout(2000);

    const initialMemory = await getMemoryUsage(page);

    if (initialMemory) {
      console.log('Initial Memory:');
      console.log(`  Used JS Heap: ${formatBytes(initialMemory.usedJSHeapSize)}`);
      console.log(`  Total JS Heap: ${formatBytes(initialMemory.totalJSHeapSize)}`);
      console.log(`  Heap Limit: ${formatBytes(initialMemory.jsHeapSizeLimit)}`);

      // Initial memory should be reasonable
      expect(initialMemory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // <50MB
    } else {
      console.log('Memory API not available');
    }
  });

  test('should track memory after loading System Mode', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const beforeMemory = await getMemoryUsage(page);

    await startSystemMode(page);
    await page.waitForTimeout(3000);

    const afterMemory = await getMemoryUsage(page);

    if (beforeMemory && afterMemory) {
      const increase = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;

      console.log('Memory After System Mode:');
      console.log(`  Before: ${formatBytes(beforeMemory.usedJSHeapSize)}`);
      console.log(`  After: ${formatBytes(afterMemory.usedJSHeapSize)}`);
      console.log(`  Increase: ${formatBytes(increase)}`);

      // Total memory should still be reasonable
      expect(afterMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // <100MB
    }
  });

  test('should not leak memory when opening many citizens', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    const beforeMemory = await getMemoryUsage(page);

    // Open and close 10 citizens
    for (let i = 0; i < 10; i++) {
      const citizenCards = page.locator('[data-testid="citizen-card"], .citizen-card');
      await citizenCards.first().click();
      await page.waitForTimeout(300);

      const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200);
      }
    }

    const afterMemory = await getMemoryUsage(page);

    if (beforeMemory && afterMemory) {
      const increase = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;

      console.log('Memory After Opening 10 Citizens:');
      console.log(`  Before: ${formatBytes(beforeMemory.usedJSHeapSize)}`);
      console.log(`  After: ${formatBytes(afterMemory.usedJSHeapSize)}`);
      console.log(`  Increase: ${formatBytes(increase)}`);

      // Should not increase dramatically
      expect(increase).toBeLessThan(30 * 1024 * 1024); // <30MB increase
    }
  });

  test('should maintain stable memory over multiple weeks', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    const initialMemory = await getMemoryUsage(page);

    // Complete 3 weeks
    for (let week = 1; week <= 3; week++) {
      console.log(`Completing week ${week}...`);
      await completeWeek(page, 'monitoring');
      await page.waitForTimeout(3000);
    }

    const finalMemory = await getMemoryUsage(page);

    if (initialMemory && finalMemory) {
      const increase = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

      console.log('Memory After 3 Weeks:');
      console.log(`  Initial: ${formatBytes(initialMemory.usedJSHeapSize)}`);
      console.log(`  Final: ${formatBytes(finalMemory.usedJSHeapSize)}`);
      console.log(`  Increase: ${formatBytes(increase)}`);

      // Memory should stay under 100MB
      expect(finalMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);

      // Increase should be reasonable (game data accumulation)
      expect(increase).toBeLessThan(50 * 1024 * 1024); // <50MB increase
    }
  });

  test('should report memory metrics summary', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    await startSystemMode(page);
    await page.waitForTimeout(3000);

    // Complete one week
    await completeWeek(page, 'monitoring');
    await page.waitForTimeout(2000);

    const memory = await getMemoryUsage(page);

    if (memory) {
      console.log('\n=== Memory Metrics Summary ===');
      console.log(`Used Heap: ${formatBytes(memory.usedJSHeapSize)}`);
      console.log(`Total Heap: ${formatBytes(memory.totalJSHeapSize)}`);
      console.log(`Heap Limit: ${formatBytes(memory.jsHeapSizeLimit)}`);
      console.log(`Utilization: ${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`);
      console.log('============================\n');

      // Should use less than 10% of heap limit
      const utilization = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      expect(utilization).toBeLessThan(0.1);
    }
  });
});
