import { test, expect } from '@playwright/test'

/**
 * Test 07 — Flag Submission UI
 *
 * Verifies that a citizen can be selected from the queue,
 * the player visits a domain tab (inferences auto-populate),
 * selects a flag type, and submits.
 *
 * Inference results are auto-attached on submit — no manual
 * finding selection is required.
 */

test.describe('07 — Flag Submission UI', () => {
  test('select citizen → visit domain tab → select flag type → submit flag', async ({ page }) => {
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

    // ── Advance to week 3 headlessly (health+finance unlocked → 6 rules fire) ─
    await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, unknown>>
      const game = w.__stores['game'] as () => Record<string, unknown>
      const citizens = w.__stores['citizens'] as () => Record<string, unknown>
      const content = w.__stores['content'] as () => Record<string, unknown>

      const skeletons = citizens()['skeletons'] as Array<Record<string, unknown>>
      const submitFlag = game()['submitFlag'] as (id: string, type: string, just: string) => void
      const advanceDirective = game()['advanceDirective'] as (d: unknown) => void
      const scenario = content()['scenario'] as Record<string, unknown>
      const directives = [...(scenario['directives'] as Array<Record<string, unknown>>)]
        .sort((a, b) => (a['week_number'] as number) - (b['week_number'] as number))

      let idx = 0
      // Week 1: quota 2
      submitFlag(skeletons[idx++]!['id'] as string, 'monitoring', 'test')
      submitFlag(skeletons[idx++]!['id'] as string, 'monitoring', 'test')
      advanceDirective(directives[1])

      // Week 2: quota 2
      submitFlag(skeletons[idx++]!['id'] as string, 'monitoring', 'test')
      submitFlag(skeletons[idx++]!['id'] as string, 'monitoring', 'test')
      advanceDirective(directives[2])
    })

    // ── Verify we're on week 3 ────────────────────────────────────────────────
    await expect(page.locator('[data-testid="week-indicator"]')).toContainText('3', { timeout: 5000 })

    // ── Clear all queued cinematics and modals ────────────────────────────────
    await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => void>>
      w.__stores['ui']()['skipCinematic']()
      w.__stores['ui']()['closeModal']()
    })
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        return (w.__stores['ui']() as Record<string, unknown>)['currentCinematic'] === null
      },
      { timeout: 3000 },
    )
    await page.waitForTimeout(300)

    // ── Select the first citizen in the queue ─────────────────────────────────
    const firstViewBtn = page.locator('[data-testid^="view-citizen-btn-"]').first()
    await firstViewBtn.click()
    await page.waitForSelector('[data-testid="identity-section"]', { timeout: 5000 })

    // Visit available domain tabs to trigger inference calculation
    const domainTabs: string[] = ['location', 'health', 'finance', 'judicial']
    for (const domain of domainTabs) {
      const tab = page.locator(`[data-testid="tab-${domain}"]`)
      if (await tab.count() > 0) {
        await tab.click()
        await page.waitForTimeout(100)
      }
    }

    // ── Select "monitoring" flag type ─────────────────────────────────────────
    const monitoringRadio = page.locator('[data-testid="flag-type-monitoring"]')
    await expect(monitoringRadio).toBeVisible()
    await monitoringRadio.click()
    await expect(monitoringRadio).toBeChecked()

    // ── Submit button should now be enabled (flag type selected is sufficient) ─
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
