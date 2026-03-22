import { test, expect } from '@playwright/test'

/**
 * Test 06 — Start Screen UI
 *
 * Verifies the country selection screen renders correctly,
 * allows selection of a country, and transitions to the dashboard
 * when Begin Shift is clicked.
 */

test.describe('06 — Start Screen UI', () => {
  test('country select → begin shift → dashboard renders', async ({ page }) => {
    // ── Navigate to the app ──────────────────────────────────────────────────
    await page.goto('/')

    // ── Wait for start screen ────────────────────────────────────────────────
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    const startScreen = page.locator('[data-testid="start-screen"]')
    await expect(startScreen).toBeVisible()

    // ── Verify 5 country cards exist ─────────────────────────────────────────
    const countryCards = page.locator('[data-testid^="country-select-"]')
    await expect(countryCards).toHaveCount(5)

    // ── Click on USA card ─────────────────────────────────────────────────────
    const usaCard = page.locator('[data-testid="country-select-usa"]')
    await usaCard.click()

    // ── Verify USA card is selected (aria-pressed = true) ────────────────────
    await expect(usaCard).toHaveAttribute('aria-pressed', 'true')

    // ── Click Begin Shift ─────────────────────────────────────────────────────
    const beginBtn = page.locator('[data-testid="begin-shift-btn"]')
    await expect(beginBtn).toBeVisible()
    await beginBtn.click()

    // ── Wait for dashboard header ─────────────────────────────────────────────
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    const dashboardHeader = page.locator('[data-testid="dashboard-header"]')
    await expect(dashboardHeader).toBeVisible()

    // ── Verify week indicator shows "1" ───────────────────────────────────────
    const weekIndicator = page.locator('[data-testid="week-indicator"]')
    await expect(weekIndicator).toBeVisible()
    await expect(weekIndicator).toContainText('1')

    // ── Verify citizen queue is visible ──────────────────────────────────────
    const citizenQueue = page.locator('[data-testid="citizen-queue"]')
    await expect(citizenQueue).toBeVisible()
  })
})
