import { test, expect } from '@playwright/test'

/**
 * Test 07 — Flag Submission UI (Option C: inference-based findings)
 *
 * Verifies that a citizen can be selected from the queue,
 * their file opens, the player visits a domain tab to unlock
 * findings, checks a finding, selects a flag type, and submits.
 */

test.describe('07 — Flag Submission UI', () => {
  test('select citizen → visit domain tab → check finding → submit flag', async ({ page }) => {
    // ── Navigate and start game ───────────────────────────────────────────────
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    // Click USA and begin shift
    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()

    // ── Wait for dashboard ────────────────────────────────────────────────────
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    // ── Find first VIEW FILE button ───────────────────────────────────────────
    const viewBtn = page.locator('[data-testid^="view-citizen-btn-"]').first()
    await expect(viewBtn).toBeVisible({ timeout: 10000 })
    await viewBtn.click()

    // ── Wait for citizen panel to show content ────────────────────────────────
    await page.waitForSelector('[data-testid="identity-section"]', { timeout: 10000 })

    // ── Verify identity section and domain tabs are visible ───────────────────
    await expect(page.locator('[data-testid="identity-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="domain-tabs"]')).toBeVisible()

    // ── Visit a domain tab to unlock findings ─────────────────────────────────
    // Week 1 has location + judicial domains unlocked
    const locationTab = page.locator('[data-testid="tab-location"]')
    await expect(locationTab).toBeVisible({ timeout: 5000 })
    await locationTab.click()

    // ── Wait for findings panel ───────────────────────────────────────────────
    await page.waitForSelector('[data-testid="findings-panel"]', { timeout: 5000 })

    // ── Check a finding that is now checkable (location tab visited) ──────────
    // Some findings may be checkable immediately after visiting location tab
    const checkableCheckbox = page.locator('[data-testid^="finding-checkbox-"]:not([disabled])').first()

    // If a checkable finding exists, check it; otherwise visit judicial tab too
    const checkableCount = await checkableCheckbox.count()
    if (checkableCount === 0) {
      const judicialTab = page.locator('[data-testid="tab-judicial"]')
      if (await judicialTab.count() > 0) {
        await judicialTab.click()
        await page.waitForTimeout(300)
      }
    }

    // Now check the first available finding checkbox
    const firstCheckbox = page.locator('[data-testid^="finding-checkbox-"]:not([disabled])').first()
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 })
    await firstCheckbox.click()
    await expect(firstCheckbox).toBeChecked()

    // ── Select "monitoring" flag type ─────────────────────────────────────────
    const monitoringRadio = page.locator('[data-testid="flag-type-monitoring"]')
    await expect(monitoringRadio).toBeVisible({ timeout: 10000 })
    await monitoringRadio.click()
    await expect(monitoringRadio).toBeChecked()

    // ── Submit the flag ───────────────────────────────────────────────────────
    const submitBtn = page.locator('[data-testid="submit-flag-btn"]')
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // ── Handle optional cinematic overlay ────────────────────────────────────
    await page.waitForTimeout(500)
    const cinematicOverlay = page.locator('[data-testid="cinematic-overlay"]')
    const isCinematicVisible = await cinematicOverlay.isVisible()

    if (isCinematicVisible) {
      const skipBtn = page.locator('[data-testid="cinematic-skip"]')
      await expect(skipBtn).toBeVisible()
      await skipBtn.click()
      await expect(cinematicOverlay).not.toBeVisible({ timeout: 5000 })
    }

    // ── Verify we're still on the dashboard ───────────────────────────────────
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })
})
