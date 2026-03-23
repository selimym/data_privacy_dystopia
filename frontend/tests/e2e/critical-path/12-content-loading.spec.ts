import { test, expect } from '@playwright/test'

/**
 * Test 12 — Content fetch paths are correct
 *
 * Verifies that all /content/ JSON files are requested and loaded successfully.
 * This catches regressions where ContentLoader reverts to absolute paths that
 * break on GitHub Pages (where the app lives under a sub-path).
 */

test.describe('12 — Content loading', () => {
  test('all content JSON files load with 200 status', async ({ page }) => {
    const responses = new Map<string, number>()

    // Intercept all network responses
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/content/')) {
        responses.set(url, response.status())
      }
    })

    // ── Navigate and start the game ──────────────────────────────────────────
    await page.goto('/')
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__initializeGame === 'function',
      { timeout: 15000 },
    )

    await page.evaluate(() =>
      (window as unknown as Record<string, (a: string, b: string) => Promise<void>>).__initializeGame('usa', 'SYS-OP-001'),
    )

    // Wait for stores to be available (game is fully initialised)
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 10000 },
    )

    // Give a brief moment for all fetches to complete
    await page.waitForTimeout(500)

    // ── Assert expected files were fetched ───────────────────────────────────
    const urlList = Array.from(responses.keys())

    const requiredPatterns = [
      'scenarios/default.json',
      'countries/usa.json',
      'inference_rules.json',
      'data_banks/health.json',
      'data_banks/finance.json',
      'data_banks/judicial.json',
      'outcomes.json',
    ]

    for (const pattern of requiredPatterns) {
      const matchingUrl = urlList.find(u => u.includes(pattern))
      expect(matchingUrl, `Expected a request for ${pattern}`).toBeTruthy()
    }

    // ── Assert no 404s ───────────────────────────────────────────────────────
    for (const [url, status] of responses.entries()) {
      expect(
        status,
        `Content file returned ${status}: ${url}`,
      ).toBe(200)
    }
  })
})
