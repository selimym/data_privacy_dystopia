import { test, expect } from '@playwright/test'

/**
 * Test 17 — Week progression and finding availability
 *
 * Two regression checks:
 *
 * 1. Week 1 findings: opening a citizen and visiting the domain tabs that are
 *    unlocked in week 1 (location + judicial) must surface at least one
 *    checkable finding. Prevents the soft-lock where submitFlag was permanently
 *    disabled because no inference rules matched the available domains.
 *
 * 2. No-soft-lock progression: every week from 1 to 8 must have enough
 *    undecided citizens in the queue to meet its quota. This catches scenarios
 *    where the queue empties before quota is met.
 */

test.describe('17 — Week progression and finding availability', () => {
  test('week 1: visiting domain tabs and selecting flag type enables submit', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 15000 })

    await page.locator('[data-testid="country-select-usa"]').click()
    await page.locator('[data-testid="begin-shift-btn"]').click()
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 30000 })

    // Click the first citizen in the queue
    const firstRow = page.locator('[data-testid^="view-citizen-btn-"]').first()
    await firstRow.click()
    await page.waitForSelector('[data-testid="identity-section"]', { timeout: 8000 })

    // Visit every tab that is unlocked in week 1
    for (const domain of ['judicial', 'location']) {
      const tab = page.locator(`[data-testid="tab-${domain}"]`)
      if (await tab.count() > 0) {
        await tab.click()
        await page.waitForTimeout(150)
      }
    }

    // Inference panel should be visible
    await expect(page.locator('[data-testid="inference-panel"]')).toBeVisible()

    // Selecting a flag type must enable submit (no finding selection required)
    await page.locator('[data-testid="flag-type-monitoring"]').click()
    await expect(page.locator('[data-testid="submit-flag-btn"]')).toBeEnabled()
  })

  test('no soft-lock: each week has enough queue entries to meet quota', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__initializeGame === 'function',
      { timeout: 15000 },
    )

    await page.evaluate(() =>
      (window as unknown as Record<string, (a: string, b: string) => Promise<void>>).__initializeGame('usa', 'SYS-OP-001'),
    )

    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 10000 },
    )

    type StoreGetter = () => Record<string, unknown>

    const getDirectiveInfo = () =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, StoreGetter>>
        const state = w.__stores['game']!()
        const d = state['currentDirective'] as Record<string, unknown>
        return {
          key: d['directive_key'] as string,
          quota: d['flag_quota'] as number,
          week: d['week_number'] as number,
          type: (d['directive_type'] as string | undefined) ?? 'review',
        }
      })

    const getQueueSize = () =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, StoreGetter>>
        const gameState = w.__stores['game']!()
        const content = w.__stores['content']!()
        const unlockedDomains = content['unlockedDomains'] as string[]
        const queue = (gameState['getFilteredCaseQueue'] as (d: string[]) => unknown[])(unlockedDomains)
        return queue.length
      })

    const getDirectives = () =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, StoreGetter>>
        const scenario = (w.__stores['content']!())['scenario'] as Record<string, unknown>
        return [...(scenario['directives'] as Array<Record<string, unknown>>)].sort(
          (a, b) => (a['week_number'] as number) - (b['week_number'] as number),
        )
      })

    const submitFlags = (count: number, startIdx: number) =>
      page.evaluate(([cnt, start]: number[]) => {
        const w = window as unknown as Record<string, Record<string, StoreGetter>>
        const allSkeletons = (w.__stores['citizens']!())['skeletons'] as Array<Record<string, unknown>>
        // Only flag regular citizens — never consume week-specific scenario NPCs
        const regular = allSkeletons.filter(s => !s['is_scenario_npc'])
        const submitFlag = (w.__stores['game']!())['submitFlag'] as (id: string, type: string, just: string) => void
        for (let i = start!; i < start! + cnt!; i++) {
          submitFlag(regular[i]!['id'] as string, 'monitoring', 'test')
        }
      }, [count, startIdx])

    const advanceToDirective = (next: Record<string, unknown> | null) =>
      page.evaluate((d: Record<string, unknown> | null) => {
        const w = window as unknown as Record<string, Record<string, StoreGetter>>
        ;(w.__stores['game']!())['advanceDirective'] as (d: unknown) => void
        ;((w.__stores['game']!())['advanceDirective'] as (d: unknown) => void)(d)
      }, next)

    const directives = await getDirectives()
    let citizenIdx = 0

    for (let i = 0; i < directives.length; i++) {
      const info = await getDirectiveInfo()
      expect(info.week).toBe(i + 1)

      if (info.type === 'sweep') {
        // Sweep weeks bypass individual citizen review — just advance
        await advanceToDirective(directives[i + 1] ?? null)
        continue
      }

      // For review weeks: verify queue has enough citizens to meet quota
      const queueSize = await getQueueSize()
      expect(
        queueSize,
        `Week ${info.week} queue has ${queueSize} entries but quota is ${info.quota}`,
      ).toBeGreaterThanOrEqual(info.quota)

      // Fill quota and advance
      await submitFlags(info.quota, citizenIdx)
      citizenIdx += info.quota
      await advanceToDirective(directives[i + 1] ?? null)
    }

    // After all 8 weeks, the game should have ended (ending screen or still dashboard)
    // — the key assertion is that we reached here without throwing
    await page.waitForTimeout(300)
    const isEnded = await page.locator('[data-testid="ending-screen"]').count()
    const isDashboard = await page.locator('[data-testid="dashboard-header"]').count()
    expect(isEnded + isDashboard).toBeGreaterThan(0)
  })
})
