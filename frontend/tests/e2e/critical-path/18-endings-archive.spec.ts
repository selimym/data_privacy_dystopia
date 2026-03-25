import { test, expect } from '@playwright/test'

/**
 * Test 18 — Endings Archive
 *
 * Verifies cross-session endings tracking:
 *   1. After completing a game, "VIEW ENDINGS ARCHIVE" button appears on the ending screen
 *   2. Navigating to the archive shows the achieved ending as unlocked
 *   3. Unachieved endings are greyed out (◇ icon, "???" title)
 *   4. Back button returns to the ending screen
 *   5. After localStorage is seeded, the "ARCHIVE" button is visible on StartScreen
 */

// Helper: run the full 8-week game loop and reach the ending screen
async function runFullGameLoop(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForFunction(
    () => typeof (window as unknown as Record<string, unknown>).__initializeGame === 'function',
    { timeout: 15000 },
  )

  // Clear any stale localStorage entries from previous test runs
  await page.evaluate(() => localStorage.removeItem('dpe_endings_seen'))

  await page.evaluate(() =>
    (window as unknown as Record<string, () => Promise<void>>).__initializeGame('usa', 'SYS-OP-001'),
  )

  await page.waitForFunction(
    () => {
      const w = window as unknown as Record<string, unknown>
      return typeof w.__stores === 'object' && w.__stores !== null
    },
    { timeout: 10000 },
  )

  const getCitizenId = (idx: number) =>
    page.evaluate((i: number) => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['citizens']() as Record<string, unknown>
      return (state['skeletons'] as Array<Record<string, unknown>>)[i]!['id'] as string
    }, idx)

  const submitFlag = (citizenId: string) =>
    page.evaluate((id: string) => {
      const w = window as unknown as Record<string, Record<string, (a: unknown, b: unknown, c: unknown) => void>>
      w.__stores['game']()['submitFlag'](id, 'monitoring', 'archive test')
    }, citizenId)

  const advanceDirective = (next: Record<string, unknown> | null) =>
    page.evaluate((n: Record<string, unknown> | null) => {
      const w = window as unknown as Record<string, Record<string, (d: unknown) => void>>
      w.__stores['game']()['advanceDirective'](n)
    }, next)

  const getAllDirectives = () =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const scenario = (w.__stores['content']() as Record<string, unknown>)['scenario'] as Record<string, unknown>
      const directives = scenario['directives'] as Array<Record<string, unknown>>
      return [...directives].sort((a, b) => (a['week_number'] as number) - (b['week_number'] as number))
    })

  const getDirectiveInfo = () =>
    page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const d = state['currentDirective'] as Record<string, unknown>
      return {
        quota: d['flag_quota'] as number,
        type: (d['directive_type'] as string | undefined) ?? 'review',
      }
    })

  const directives = await getAllDirectives()
  let citizenIdx = 0

  for (let w = 0; w < 8; w++) {
    const info = await getDirectiveInfo()
    if (info.type !== 'sweep') {
      for (let f = 0; f < info.quota; f++) {
        const cid = await getCitizenId(citizenIdx++)
        await submitFlag(cid)
      }
    }
    await advanceDirective(w < 7 ? directives[w + 1]! : null)
  }

  await page.waitForFunction(
    () => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['ui']() as Record<string, unknown>)['currentScreen'] === 'ending'
    },
    { timeout: 5000 },
  )
}

test.describe('18 — Endings Archive', () => {
  test('archive button appears on ending screen and navigates to archive', async ({ page }) => {
    await runFullGameLoop(page)

    // ── Ending screen visible ─────────────────────────────────────────────
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="ending-screen"]')).toBeVisible()

    // ── "VIEW ENDINGS ARCHIVE" button should be visible ───────────────────
    const archiveBtn = page.locator('[data-testid="view-archive-btn"]')
    await expect(archiveBtn).toBeVisible()

    // ── Clicking navigates to archive screen ──────────────────────────────
    await archiveBtn.click()

    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        return (w.__stores['ui']() as Record<string, unknown>)['currentScreen'] === 'endings_archive'
      },
      { timeout: 3000 },
    )

    await page.waitForSelector('[data-testid="endings-archive"]', { timeout: 5000 })
    await expect(page.locator('[data-testid="endings-archive"]')).toBeVisible()
  })

  test('achieved ending shows filled icon; unachieved endings are greyed', async ({ page }) => {
    await runFullGameLoop(page)

    // Grab the ending type that was just reached (stored on window.__endingResult by gameStore)
    await page.waitForFunction(
      () => !!(window as unknown as Record<string, unknown>).__endingResult,
      { timeout: 3000 },
    )
    const endingType = await page.evaluate(() => {
      const result = (window as unknown as Record<string, unknown>).__endingResult as Record<string, unknown> | undefined
      return result?.['ending_type'] as string | undefined
    })
    expect(endingType).toBeTruthy()

    // Navigate to archive
    await page.waitForSelector('[data-testid="view-archive-btn"]', { timeout: 10000 })
    await page.locator('[data-testid="view-archive-btn"]').click()
    await page.waitForSelector('[data-testid="endings-archive"]', { timeout: 5000 })

    // At least one ending card should show the filled diamond ◆ (achieved)
    const filledDiamonds = page.locator('[data-testid="endings-archive"]').getByText('◆')
    await expect(filledDiamonds.first()).toBeVisible()

    // Multiple unachieved endings should show ◇
    const emptyDiamonds = page.locator('[data-testid="endings-archive"]').getByText('◇')
    const emptyCount = await emptyDiamonds.count()
    expect(emptyCount).toBeGreaterThan(5) // 9 endings unachieved out of 10

    // The achieved ending card title should be visible (not "???")
    // Unachieved cards should show "???"
    const unknownTitles = page.locator('[data-testid="endings-archive"]').getByText('???')
    const unknownCount = await unknownTitles.count()
    expect(unknownCount).toBeGreaterThan(5)
  })

  test('back button from archive returns to ending screen', async ({ page }) => {
    await runFullGameLoop(page)

    await page.waitForSelector('[data-testid="view-archive-btn"]', { timeout: 10000 })
    await page.locator('[data-testid="view-archive-btn"]').click()
    await page.waitForSelector('[data-testid="endings-archive"]', { timeout: 5000 })

    // ── Click back button ────────────────────────────────────────────────
    const backBtn = page.locator('[data-testid="archive-back-btn"]')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Should navigate back to ending screen
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        return (w.__stores['ui']() as Record<string, unknown>)['currentScreen'] === 'ending'
      },
      { timeout: 3000 },
    )

    await expect(page.locator('[data-testid="ending-screen"]')).toBeVisible()
  })

  test('archive button visible on StartScreen when endings have been seen', async ({ page }) => {
    // Seed localStorage with a completed ending before navigating
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('dpe_endings_seen', JSON.stringify(['compliant_operator']))
    })

    // Reload so StartScreen picks up localStorage
    await page.reload()
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 10000 })

    // Archive button should be visible on start screen
    await expect(page.locator('[data-testid="open-archive-btn"]')).toBeVisible()
  })

  test('archive button NOT visible on StartScreen when no endings seen', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('dpe_endings_seen'))
    await page.reload()
    await page.waitForSelector('[data-testid="start-screen"]', { timeout: 10000 })

    // Archive button should NOT be present when no endings achieved
    await expect(page.locator('[data-testid="open-archive-btn"]')).not.toBeVisible()
  })

  test('endings persist in localStorage and are reflected in archive count', async ({ page }) => {
    await runFullGameLoop(page)

    // Wait for ending screen; markEndingSeen is called via EndingScreen useEffect
    await page.waitForSelector('[data-testid="ending-screen"]', { timeout: 10000 })

    // Wait a tick for the useEffect to run
    await page.waitForTimeout(500)

    // Verify localStorage was written
    const seen = await page.evaluate(() => {
      const raw = localStorage.getItem('dpe_endings_seen')
      return raw ? (JSON.parse(raw) as string[]) : []
    })
    expect(seen.length).toBeGreaterThan(0)

    // Navigate to archive and verify seen count is shown
    await page.locator('[data-testid="view-archive-btn"]').click()
    await page.waitForSelector('[data-testid="endings-archive"]', { timeout: 5000 })

    // Archive header shows "X / 10 outcomes discovered"
    const archiveText = await page.locator('[data-testid="endings-archive"]').textContent()
    expect(archiveText).toMatch(/\d+\s*\/\s*10\s+outcomes\s+discovered/i)
  })
})
