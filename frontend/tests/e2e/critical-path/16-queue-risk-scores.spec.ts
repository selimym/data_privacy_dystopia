import { test, expect } from '@playwright/test'

/**
 * Test 16 — Queue risk scores populate without citizen click
 *
 * Regression test for the bug where CitizenQueue did not subscribe to
 * citizenStore.skeletons, so background worker updates to risk_score_cache
 * never triggered a re-render. Scores stayed '···' until the user clicked
 * a citizen (which caused a uiStore change → re-render).
 *
 * This test verifies that risk scores appear in the queue on their own,
 * without the player clicking any citizen file.
 */

test.describe('16 — Queue risk scores', () => {
  test('scores populate in queue without clicking any citizen', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()

    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    // Do NOT click any citizen — verify scores appear on their own.
    // Background worker processes 50 citizens in batches of 5; allow up to 20s.
    await page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('[data-testid^="risk-badge-"]')
        if (rows.length < 5) return false
        // Count rows whose text is NOT '···' (the null-score placeholder)
        const populated = Array.from(rows).filter(el => el.textContent?.trim() !== '···')
        return populated.length >= 5
      },
      { timeout: 20000 },
    )

    // At least 5 queue rows should have a real score badge visible
    const populatedBadges = page.locator('[data-testid^="risk-badge-"]').filter({ hasNotText: '···' })
    await expect(populatedBadges).toHaveCount(await populatedBadges.count())
    expect(await populatedBadges.count()).toBeGreaterThanOrEqual(5)
  })
})
