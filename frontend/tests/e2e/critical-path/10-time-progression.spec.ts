import { test, expect } from '@playwright/test'

/**
 * Test 10 — Time Progression
 *
 * Verifies week advancement mechanics:
 * - completing week 1 quota unlocks advancement
 * - week indicator updates after advancing
 * - quota resets to 0 for new directive
 * - directives change each week
 * - cumulative flag count tracks across weeks
 */

test.describe('10 — Time Progression', () => {
  // ── Shared setup ──────────────────────────────────────────────────────────
  async function startGameAndWaitForStores(page: import('@playwright/test').Page) {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })
    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 15000 },
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getDirectiveInfo = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const d = state['currentDirective'] as Record<string, unknown>
      return {
        key: d['directive_key'] as string,
        quota: d['flag_quota'] as number,
        week: d['week_number'] as number,
        title: d['title'] as string,
      }
    })

  const getWeekNumber = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['game']() as Record<string, unknown>)['weekNumber'] as number
    })

  const getTotalFlags = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return ((w.__stores['game']() as Record<string, unknown>)['flags'] as unknown[]).length
    })

  const getFlagsForDirective = (page: import('@playwright/test').Page, key: string) =>
    page.evaluate((k: string) => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const flags = (w.__stores['game']() as Record<string, unknown>)['flags'] as Array<Record<string, unknown>>
      return flags.filter(f => f['directive_key'] === k).length
    }, key)

  const submitFlags = async (page: import('@playwright/test').Page, count: number, startIdx: number) => {
    for (let i = 0; i < count; i++) {
      await page.evaluate((idx: number) => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
        const citizenId = skeletons[idx]!['id'] as string
        ;(w.__stores['game']() as Record<string, (a: unknown, b: unknown, c: unknown) => void>)
          ['submitFlag'](citizenId, 'monitoring', 'time progression test')
      }, startIdx + i)
    }
  }

  const advanceWeek = (page: import('@playwright/test').Page, nextDirective: Record<string, unknown> | null) =>
    page.evaluate((next: Record<string, unknown> | null) => {
      const w = window as unknown as Record<string, Record<string, (d: unknown) => void>>
      w.__stores['game']()['advanceDirective'](next)
    }, nextDirective)

  const getAllDirectives = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const scenario = (w.__stores['content']() as Record<string, unknown>)['scenario'] as Record<string, unknown>
      const directives = scenario['directives'] as Array<Record<string, unknown>>
      return [...directives].sort((a, b) => (a['week_number'] as number) - (b['week_number'] as number))
    })

  // ── Test 1: Complete Week 1 quota ─────────────────────────────────────────
  test('should complete Week 1 quota', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const info = await getDirectiveInfo(page)
    expect(info.week).toBe(1)
    expect(info.quota).toBe(2)

    await submitFlags(page, info.quota, 0)

    const flags = await getFlagsForDirective(page, info.key)
    expect(flags).toBe(2)

    // Advance button should appear
    await expect(page.locator('[data-testid="advance-week-btn"]')).toBeVisible({ timeout: 10000 })
  })

  // ── Test 2: Week 2 directive shown after Week 1 complete ─────────────────
  test('should show Week 2 directive after Week 1 complete', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const directives = await getAllDirectives(page)
    const week1 = await getDirectiveInfo(page)
    await submitFlags(page, week1.quota, 0)
    await advanceWeek(page, directives[1]!)

    await expect(page.locator('[data-testid="week-indicator"]')).toContainText('2', { timeout: 10000 })

    const week2 = await getDirectiveInfo(page)
    expect(week2.week).toBe(2)
    expect(week2.title).not.toBe(week1.title)
  })

  // ── Test 3: Quota resets to 0 after week advancement ─────────────────────
  test('should reset quota to 0/3 after week advancement', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const directives = await getAllDirectives(page)
    const week1 = await getDirectiveInfo(page)
    await submitFlags(page, week1.quota, 0)
    await advanceWeek(page, directives[1]!)

    // Week 2 flags for its directive key should be 0
    const week2 = await getDirectiveInfo(page)
    const week2Flags = await getFlagsForDirective(page, week2.key)
    expect(week2Flags).toBe(0)
  })

  // ── Test 4: Progress through Weeks 1–3 ───────────────────────────────────
  test('should progress through Weeks 1-3', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const directives = await getAllDirectives(page)
    let citizenIdx = 0

    for (let w = 0; w < 3; w++) {
      const info = await getDirectiveInfo(page)
      expect(info.week).toBe(w + 1)
      await submitFlags(page, info.quota, citizenIdx)
      citizenIdx += info.quota
      if (w < 2) await advanceWeek(page, directives[w + 1]!)
    }

    const week = await getWeekNumber(page)
    expect(week).toBe(3)
  })

  // ── Test 5: Cumulative flags tracked across weeks ─────────────────────────
  test('should track cumulative flags across weeks', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const directives = await getAllDirectives(page)

    // Week 1: quota 2
    const w1 = await getDirectiveInfo(page)
    await submitFlags(page, w1.quota, 0)
    await advanceWeek(page, directives[1]!)

    // Week 2: quota 2
    const w2 = await getDirectiveInfo(page)
    await submitFlags(page, w2.quota, w1.quota)
    await advanceWeek(page, directives[2]!)

    const total = await getTotalFlags(page)
    expect(total).toBe(w1.quota + w2.quota)
  })

  // ── Test 6: Different directives each week ────────────────────────────────
  test('should display different directives each week', async ({ page }) => {
    await startGameAndWaitForStores(page)

    const directives = await getAllDirectives(page)
    const titles: string[] = []
    let citizenIdx = 0

    for (let w = 0; w < 3; w++) {
      const info = await getDirectiveInfo(page)
      titles.push(info.title)
      await submitFlags(page, info.quota, citizenIdx)
      citizenIdx += info.quota
      if (w < 2) await advanceWeek(page, directives[w + 1]!)
    }

    // All 3 directive titles should be unique
    const uniqueTitles = new Set(titles)
    expect(uniqueTitles.size).toBe(3)
  })
})
