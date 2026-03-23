import { test, expect } from '@playwright/test'

/**
 * Test 14 — Country selection: only approved countries are shown
 *
 * Verifies that exactly 3 country cards are visible (USA, UK, France),
 * and that removed countries are not present in the UI.
 * Also smoke-tests that UK and France can boot a game successfully.
 */

test.describe('14 — Country selection', () => {
  test('shows exactly 3 country cards — usa, uk, france', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    const allCards = page.locator('[data-testid^="country-select-"]')
    await expect(allCards).toHaveCount(3)

    // Approved countries are present
    await expect(page.locator('[data-testid="country-select-usa"]')).toBeVisible()
    await expect(page.locator('[data-testid="country-select-uk"]')).toBeVisible()
    await expect(page.locator('[data-testid="country-select-france"]')).toBeVisible()

    // Removed countries are absent
    await expect(page.locator('[data-testid="country-select-china"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="country-select-russia"]')).toHaveCount(0)
  })

  test('UK boots to week-1 dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-uk"]').click()
    await expect(page.locator('[data-testid="country-select-uk"]')).toHaveAttribute('aria-pressed', 'true')

    await page.locator('[data-testid="begin-shift-btn"]').click()
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    await expect(page.locator('[data-testid="week-indicator"]')).toContainText('1')
    await expect(page.locator('[data-testid="citizen-queue"]')).toBeVisible()
  })

  test('France boots to week-1 dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-france"]').click()
    await expect(page.locator('[data-testid="country-select-france"]')).toHaveAttribute('aria-pressed', 'true')

    await page.locator('[data-testid="begin-shift-btn"]').click()
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    await expect(page.locator('[data-testid="week-indicator"]')).toContainText('1')
    await expect(page.locator('[data-testid="citizen-queue"]')).toBeVisible()
  })
})
