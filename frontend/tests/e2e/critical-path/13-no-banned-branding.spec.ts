import { test, expect } from '@playwright/test'

/**
 * Test 13 — No prohibited trademark text in the UI
 *
 * Ensures no third-party trademarked branding appears in the start screen
 * or anywhere in the initial page content.
 */

test.describe('13 — Branding guard', () => {
  test('start screen contains no prohibited trademark text', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    // Grab all visible text on the page
    const bodyText = await page.evaluate(() => document.body.innerText)

    // Must not claim to be a third-party product
    expect(bodyText).not.toContain('Powered by Palantir')
    expect(bodyText).not.toContain('Palantir Technologies')

    // The neutral platform label should be present instead
    expect(bodyText).toContain('INTELLIGENCE ANALYTICS PLATFORM')
  })
})
