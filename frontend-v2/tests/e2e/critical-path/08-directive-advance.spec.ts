import { test, expect } from '@playwright/test'

/**
 * Test 08 — Directive Advance
 *
 * Verifies that after meeting the week 1 quota via window.__stores,
 * the "ADVANCE WEEK" button becomes visible and clicking it advances
 * the week indicator and updates the directive panel.
 */

test.describe('08 — Directive Advance', () => {
  test('fill quota via stores → advance week → week 2 + new directive', async ({ page }) => {
    // ── Navigate and start game ───────────────────────────────────────────────
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    // Click USA and begin shift
    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()

    // ── Wait for dashboard ────────────────────────────────────────────────────
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    // ── Wait for stores to be available ──────────────────────────────────────
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 15000 },
    )

    // ── Verify we're on week 1 ────────────────────────────────────────────────
    const weekIndicator = page.locator('[data-testid="week-indicator"]')
    await expect(weekIndicator).toContainText('1')

    // ── Get week 1 quota and directive key ────────────────────────────────────
    const week1Info = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const d = state['currentDirective'] as Record<string, unknown>
      return {
        key: d['directive_key'] as string,
        quota: d['flag_quota'] as number,
      }
    })

    // ── Get week 1 directive title (for comparison later) ────────────────────
    const week1DirectiveTitle = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const d = state['currentDirective'] as Record<string, unknown>
      return d['title'] as string
    })

    // ── Submit enough flags to meet quota ─────────────────────────────────────
    for (let i = 0; i < week1Info.quota; i++) {
      await page.evaluate((idx: number) => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const citizenState = w.__stores['citizens']() as Record<string, unknown>
        const skeletons = citizenState['skeletons'] as Array<Record<string, unknown>>
        const citizenId = skeletons[idx]!['id'] as string
        const gameStore = w.__stores['game']() as Record<string, (a: unknown, b: unknown, c: unknown) => void>
        gameStore['submitFlag'](citizenId, 'monitoring', 'test justification for e2e test')
      }, i)
    }

    // ── Dismiss any cinematic overlays that appear after flagging ────────────
    // Flags trigger outcome cinematics; we must skip them before proceeding
    const cinematicOverlay = page.locator('[data-testid="cinematic-overlay"]')
    const cinematicSkip = page.locator('[data-testid="cinematic-skip"]')

    // Keep dismissing cinematics until none remain (max 10 attempts)
    for (let attempt = 0; attempt < 10; attempt++) {
      const isVisible = await cinematicOverlay.isVisible()
      if (!isVisible) break
      await cinematicSkip.click()
      await page.waitForTimeout(300)
    }

    // Wait for any remaining cinematic to go away
    await expect(cinematicOverlay).not.toBeVisible({ timeout: 5000 })

    // ── Wait for advance-week-btn to become visible (quota met) ──────────────
    const advanceBtn = page.locator('[data-testid="advance-week-btn"]')
    await expect(advanceBtn).toBeVisible({ timeout: 10000 })

    // ── Click advance week ────────────────────────────────────────────────────
    await advanceBtn.click()

    // ── Wait for week indicator to show "2" ──────────────────────────────────
    await expect(weekIndicator).toContainText('2', { timeout: 10000 })

    // ── Verify directive panel shows a new directive ──────────────────────────
    const directivePanel = page.locator('[data-testid="directive-panel"]')
    await expect(directivePanel).toBeVisible()

    // The directive title should have changed (or at minimum the panel is still there)
    const directiveTitle = page.locator('[data-testid="directive-title"]')
    await expect(directiveTitle).toBeVisible()

    const week2DirectiveTitle = await directiveTitle.textContent()
    // Week 2 directive title should differ from week 1 (different directive)
    expect(week2DirectiveTitle).not.toBe(week1DirectiveTitle)
  })
})
