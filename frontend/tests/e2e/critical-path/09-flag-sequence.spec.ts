import { test, expect } from '@playwright/test'

/**
 * Test 09 — Multiple Flags in Sequence
 *
 * Verifies that submitting multiple flags within the same directive works:
 * quota counter increments correctly for each flag and all flags are recorded
 * in the store.
 */

test.describe('09 — Flag Sequence', () => {
  test('should handle multiple flags in sequence', async ({ page }) => {
    // ── Navigate and start game ───────────────────────────────────────────────
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()

    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    // ── Wait for stores ───────────────────────────────────────────────────────
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 15000 },
    )

    // ── Get week 1 directive info ─────────────────────────────────────────────
    const directiveInfo = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const d = state['currentDirective'] as Record<string, unknown>
      return {
        key: d['directive_key'] as string,
        quota: d['flag_quota'] as number,
      }
    })

    // Week 1 quota is 2
    expect(directiveInfo.quota).toBe(2)

    // ── Submit first flag ─────────────────────────────────────────────────────
    const citizen0Id = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['citizens']() as Record<string, unknown>
      return (state['skeletons'] as Array<Record<string, unknown>>)[0]!['id'] as string
    })

    await page.evaluate((id: string) => {
      const w = window as unknown as Record<string, Record<string, (a: unknown, b: unknown, c: unknown) => void>>
      w.__stores['game']()['submitFlag'](id, 'monitoring', 'first flag justification')
    }, citizen0Id)

    // ── Verify first flag recorded ────────────────────────────────────────────
    const flagsAfterFirst = await page.evaluate((key: string) => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const flags = state['flags'] as Array<Record<string, unknown>>
      return flags.filter(f => f['directive_key'] === key).length
    }, directiveInfo.key)

    expect(flagsAfterFirst).toBe(1)

    // ── Submit second flag ────────────────────────────────────────────────────
    const citizen1Id = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['citizens']() as Record<string, unknown>
      return (state['skeletons'] as Array<Record<string, unknown>>)[1]!['id'] as string
    })

    await page.evaluate((id: string) => {
      const w = window as unknown as Record<string, Record<string, (a: unknown, b: unknown, c: unknown) => void>>
      w.__stores['game']()['submitFlag'](id, 'restriction', 'second flag justification')
    }, citizen1Id)

    // ── Verify both flags recorded ────────────────────────────────────────────
    const flagsAfterSecond = await page.evaluate((key: string) => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const flags = state['flags'] as Array<Record<string, unknown>>
      return flags.filter(f => f['directive_key'] === key).length
    }, directiveInfo.key)

    expect(flagsAfterSecond).toBe(2)

    // ── Verify flags have different types ─────────────────────────────────────
    const flagTypes = await page.evaluate((key: string) => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const flags = state['flags'] as Array<Record<string, unknown>>
      return flags
        .filter(f => f['directive_key'] === key)
        .map(f => f['flag_type'] as string)
    }, directiveInfo.key)

    expect(flagTypes).toContain('monitoring')
    expect(flagTypes).toContain('restriction')

    // ── Verify advance-week-btn appears (quota met) ───────────────────────────
    const advanceBtn = page.locator('[data-testid="advance-week-btn"]')
    await expect(advanceBtn).toBeVisible({ timeout: 10000 })
  })
})
