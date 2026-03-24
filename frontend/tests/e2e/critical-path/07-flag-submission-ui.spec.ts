import { test, expect } from '@playwright/test'

/**
 * Test 07 — Flag Submission UI (Option C: inference-based findings)
 *
 * Verifies that a citizen can be selected from the queue,
 * the player visits a domain tab to unlock findings, checks
 * a finding, selects a flag type, and submits.
 *
 * Week 1 has no inference rules (location+judicial only).
 * We advance headlessly to week 2 (health unlocked) where
 * findings fire, then exercise the UI flow.
 */

test.describe('07 — Flag Submission UI', () => {
  test('select citizen → visit domain tab → check finding → submit flag', async ({ page }) => {
    // ── Navigate and start game ───────────────────────────────────────────────
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()

    // ── Wait for dashboard + stores ───────────────────────────────────────────
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 10000 },
    )

    // ── Advance to week 2 headlessly (health domain unlocked → findings fire) ─
    // Submit 2 flags for week 1 quota, then advance directive
    await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, unknown>>
      const game = w.__stores['game'] as () => Record<string, unknown>
      const citizens = w.__stores['citizens'] as () => Record<string, unknown>
      const content = w.__stores['content'] as () => Record<string, unknown>

      const skeletons = (citizens()['skeletons'] as Array<Record<string, unknown>>)
      // Submit week 1 quota (2 flags)
      const submitFlag = game()['submitFlag'] as (id: string, type: string, just: string) => void
      submitFlag(skeletons[0]!['id'] as string, 'monitoring', 'test')
      submitFlag(skeletons[1]!['id'] as string, 'monitoring', 'test')

      // Advance to week 2
      const scenario = (content()['scenario'] as Record<string, unknown>)
      const directives = [...(scenario['directives'] as Array<Record<string, unknown>>)]
        .sort((a, b) => (a['week_number'] as number) - (b['week_number'] as number))
      const advanceDirective = game()['advanceDirective'] as (d: unknown) => void
      advanceDirective(directives[1])
    })

    // ── Verify we're on week 2 ────────────────────────────────────────────────
    await expect(page.locator('[data-testid="week-indicator"]')).toContainText('2', { timeout: 5000 })

    // ── Select first citizen from queue ───────────────────────────────────────
    const viewBtn = page.locator('[data-testid^="view-citizen-btn-"]').first()
    await expect(viewBtn).toBeVisible({ timeout: 10000 })
    await viewBtn.click()

    // ── Wait for citizen panel to load ────────────────────────────────────────
    await page.waitForSelector('[data-testid="identity-section"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="domain-tabs"]')).toBeVisible()

    // ── Visit all unlocked domain tabs to maximise checkable findings ─────────
    for (const domain of ['location', 'health', 'judicial']) {
      const tab = page.locator(`[data-testid="tab-${domain}"]`)
      if (await tab.count() > 0) {
        await tab.click()
        await page.waitForTimeout(200)
      }
    }

    // ── Wait for a checkable finding to appear ────────────────────────────────
    await page.waitForSelector('[data-testid^="finding-checkbox-"]:not([disabled])', { timeout: 8000 })

    // ── Check the first enabled finding ──────────────────────────────────────
    const firstCheckbox = page.locator('[data-testid^="finding-checkbox-"]:not([disabled])').first()
    await firstCheckbox.click()
    await expect(firstCheckbox).toBeChecked()

    // ── Select "monitoring" flag type ─────────────────────────────────────────
    const monitoringRadio = page.locator('[data-testid="flag-type-monitoring"]')
    await expect(monitoringRadio).toBeVisible()
    await monitoringRadio.click()
    await expect(monitoringRadio).toBeChecked()

    // ── Submit button should now be enabled ───────────────────────────────────
    const submitBtn = page.locator('[data-testid="submit-flag-btn"]')
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // ── Handle optional cinematic overlay ────────────────────────────────────
    await page.waitForTimeout(500)
    const cinematicOverlay = page.locator('[data-testid="cinematic-overlay"]')
    if (await cinematicOverlay.isVisible()) {
      const skipBtn = page.locator('[data-testid="cinematic-skip"]')
      await expect(skipBtn).toBeVisible()
      await skipBtn.click()
      await expect(cinematicOverlay).not.toBeVisible({ timeout: 5000 })
    }

    // ── Verify we're still on the dashboard ───────────────────────────────────
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
  })
})
