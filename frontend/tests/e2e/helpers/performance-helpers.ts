import { Page } from '@playwright/test';

/**
 * Performance measurement utilities for load time, FPS, and memory testing.
 */

export interface LoadTimeMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface FPSMetrics {
  average: number;
  minimum: number;
  maximum: number;
  samples: number[];
}

/**
 * Measure page load time metrics
 */
export async function measureLoadTime(page: Page): Promise<LoadTimeMetrics> {
  return await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const firstPaint = paintEntries.find((entry) => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );

    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      firstPaint: firstPaint ? firstPaint.startTime : 0,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
    };
  });
}

/**
 * Get current memory usage (Chrome only)
 */
export async function getMemoryUsage(page: Page): Promise<MemoryMetrics | null> {
  return await page.evaluate(() => {
    // @ts-ignore - performance.memory is Chrome-specific
    if (!performance.memory) {
      return null;
    }

    // @ts-ignore
    const mem = performance.memory;
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
    };
  });
}

/**
 * Measure FPS over a duration
 */
export async function measureFPS(page: Page, durationMs = 10000): Promise<FPSMetrics> {
  return await page.evaluate(async (duration) => {
    return new Promise<FPSMetrics>((resolve) => {
      const samples: number[] = [];
      let lastTime = performance.now();
      let animationId: number;

      const measure = () => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        const fps = 1000 / delta;

        samples.push(fps);
        lastTime = currentTime;

        if (currentTime - startTime < duration) {
          animationId = requestAnimationFrame(measure);
        } else {
          cancelAnimationFrame(animationId);

          const average = samples.reduce((a, b) => a + b, 0) / samples.length;
          const minimum = Math.min(...samples);
          const maximum = Math.max(...samples);

          resolve({
            average,
            minimum,
            maximum,
            samples,
          });
        }
      };

      const startTime = performance.now();
      animationId = requestAnimationFrame(measure);
    });
  }, durationMs);
}

/**
 * Measure time to complete an action
 */
export async function measureActionTime<T>(
  action: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await action();
  const duration = performance.now() - startTime;

  return { result, duration };
}

/**
 * Wait for performance metrics to stabilize
 */
export async function waitForStablePerformance(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isStable = await page.evaluate(() => {
      // Check if there are any pending resource loads
      const perfEntries = performance.getEntriesByType('resource');
      const recentLoads = perfEntries.filter(
        (entry) => entry.startTime > performance.now() - 1000
      );

      return recentLoads.length === 0;
    });

    if (isStable) {
      return;
    }

    await page.waitForTimeout(100);
  }
}

/**
 * Get resource load timings
 */
export async function getResourceTimings(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .map((entry: any) => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || 0,
        type: entry.initiatorType,
      }))
      .sort((a, b) => b.duration - a.duration);
  });
}

/**
 * Convert bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format milliseconds to readable time
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}
