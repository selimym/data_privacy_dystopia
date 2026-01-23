import { test, expect } from '@playwright/test';
import { clearGameStorage } from '../helpers/indexeddb-helpers';
import { startSystemMode } from '../helpers/game-setup';
import { measureFPS } from '../helpers/performance-helpers';

/**
 * Performance Test: FPS Monitoring
 *
 * Monitors frame rate during gameplay:
 * - Measure FPS for 10 seconds during gameplay
 * - Assert average ≥55 FPS
 * - Assert minimum ≥30 FPS
 */

test.describe('FPS Monitoring Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGameStorage(page);
  });

  test('should maintain ≥55 FPS average during gameplay', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    console.log('Measuring FPS for 10 seconds...');

    const fpsMetrics = await measureFPS(page, 10000);

    console.log('FPS Metrics:');
    console.log(`  Average: ${fpsMetrics.average.toFixed(2)} FPS`);
    console.log(`  Minimum: ${fpsMetrics.minimum.toFixed(2)} FPS`);
    console.log(`  Maximum: ${fpsMetrics.maximum.toFixed(2)} FPS`);
    console.log(`  Samples: ${fpsMetrics.samples.length}`);

    // Average should be ≥55 FPS
    expect(fpsMetrics.average).toBeGreaterThanOrEqual(55);

    // Minimum should be ≥30 FPS (no severe drops)
    expect(fpsMetrics.minimum).toBeGreaterThanOrEqual(30);
  });

  test('should maintain stable FPS while interacting with UI', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Start FPS measurement
    const measurementPromise = measureFPS(page, 8000);

    // Interact with UI while measuring
    await page.waitForTimeout(1000);

    // Open citizen file
    const citizenCards = page.locator('[data-testid="citizen-card"], .citizen-card');
    await citizenCards.first().click();
    await page.waitForTimeout(1000);

    // Switch tabs
    const tabs = ['risk-factors', 'messages', 'domains'];
    for (const tabName of tabs) {
      const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
      if ((await tab.count()) > 0) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }

    // Close citizen file
    const closeButton = page.locator('[data-testid="close-citizen-file"], [aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Wait for measurement to complete
    const fpsMetrics = await measurementPromise;

    console.log('FPS During UI Interaction:');
    console.log(`  Average: ${fpsMetrics.average.toFixed(2)} FPS`);
    console.log(`  Minimum: ${fpsMetrics.minimum.toFixed(2)} FPS`);

    // FPS should remain stable during interaction
    expect(fpsMetrics.average).toBeGreaterThanOrEqual(50);
    expect(fpsMetrics.minimum).toBeGreaterThanOrEqual(25);
  });

  test('should maintain FPS during flag submission', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Open citizen
    const citizenCards = page.locator('[data-testid="citizen-card"], .citizen-card');
    await citizenCards.first().click();
    await page.waitForTimeout(500);

    // Start measurement
    const measurementPromise = measureFPS(page, 5000);

    // Submit flag
    const flagButton = page.getByRole('button', { name: /monitoring/i });
    if (await flagButton.isVisible()) {
      await flagButton.click();
      await page.waitForTimeout(300);

      const justificationField = page.locator('textarea').first();
      if (await justificationField.isVisible()) {
        await justificationField.fill('Performance test flag');

        const submitButton = page.getByRole('button', { name: /submit|confirm/i });
        await submitButton.click();
      }
    }

    const fpsMetrics = await measurementPromise;

    console.log('FPS During Flag Submission:');
    console.log(`  Average: ${fpsMetrics.average.toFixed(2)} FPS`);
    console.log(`  Minimum: ${fpsMetrics.minimum.toFixed(2)} FPS`);

    // Should maintain reasonable FPS
    expect(fpsMetrics.average).toBeGreaterThanOrEqual(45);
  });

  test('should report FPS statistics', async ({ page }) => {
    await startSystemMode(page);
    await page.waitForTimeout(2000);

    const fpsMetrics = await measureFPS(page, 5000);

    // Calculate percentiles
    const sortedSamples = [...fpsMetrics.samples].sort((a, b) => a - b);
    const p50 = sortedSamples[Math.floor(sortedSamples.length * 0.5)];
    const p95 = sortedSamples[Math.floor(sortedSamples.length * 0.95)];
    const p99 = sortedSamples[Math.floor(sortedSamples.length * 0.99)];

    console.log('\n=== FPS Statistics ===');
    console.log(`Average: ${fpsMetrics.average.toFixed(2)} FPS`);
    console.log(`Median (P50): ${p50.toFixed(2)} FPS`);
    console.log(`P95: ${p95.toFixed(2)} FPS`);
    console.log(`P99: ${p99.toFixed(2)} FPS`);
    console.log(`Min: ${fpsMetrics.minimum.toFixed(2)} FPS`);
    console.log(`Max: ${fpsMetrics.maximum.toFixed(2)} FPS`);
    console.log(`Samples: ${fpsMetrics.samples.length}`);
    console.log('=====================\n');

    // Median should be good
    expect(p50).toBeGreaterThanOrEqual(55);
  });

  test.skip('should detect FPS drops during cinematics', async ({ page }) => {
    // This test measures FPS during cinematic playback
    // Marked as skip because cinematics may have different FPS targets

    await startSystemMode(page);
    await page.waitForTimeout(2000);

    // Trigger cinematic by completing quota
    // ... implementation depends on cinematic trigger mechanism

    console.log('Cinematic FPS test - implementation pending');
  });
});
