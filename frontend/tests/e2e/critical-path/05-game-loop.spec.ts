import { test, expect } from '@playwright/test'

/**
 * Phase 5 — Core Game Loop E2E Test
 *
 * Drives the full 6-week directive loop headlessly via window.__stores and
 * window.__initializeGame. No UI elements are relied upon.
 *
 * Week quotas: 1→2, 2→2, 3→3, 4→4, 5→5, 6→1
 * Contract events fire when advancing TO a week: weeks 2, 3, 4 (autoflag), 5
 */

test.describe('Phase 5 — Core Game Loop', () => {
  test('full directive loop: week 1→6, contract events, autoflag, ending', async ({ page }) => {
    // ── Navigate to the app ──────────────────────────────────────────────────
    await page.goto('/')

    // ── Wait for React to mount and DEV globals to be available ─────────────
    // __initializeGame is exposed at module load time in DEV
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__initializeGame === 'function',
      { timeout: 15000 },
    )

    // ── Initialize the game ──────────────────────────────────────────────────
    // This is async: loads JSON content, generates citizens, sets up stores
    // and exposes __stores on window
    await page.evaluate(() =>
      (window as unknown as Record<string, () => Promise<void>>).__initializeGame('usa', 'SYS-OP-001'),
    )

    // ── Wait for stores to be available (set inside initializeGame) ──────────
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, unknown>
        return typeof w.__stores === 'object' && w.__stores !== null
      },
      { timeout: 10000 },
    )

    // ── Verify week 1 is initialised ─────────────────────────────────────────
    const weekNumber = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['game']() as Record<string, unknown>)['weekNumber']
    })
    expect(weekNumber).toBe(1)

    // ── Helper: get a citizen ID ──────────────────────────────────────────────
    const getCitizenId = async (index: number): Promise<string> =>
      page.evaluate((idx: number) => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['citizens']() as Record<string, unknown>
        const skeletons = state['skeletons'] as Array<Record<string, unknown>>
        return skeletons[idx]!['id'] as string
      }, index)

    // ── Helper: get current directive key and quota ───────────────────────────
    const getDirectiveInfo = async (): Promise<{ key: string; quota: number; week: number }> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['game']() as Record<string, unknown>
        const d = state['currentDirective'] as Record<string, unknown>
        return {
          key: d['directive_key'] as string,
          quota: d['flag_quota'] as number,
          week: d['week_number'] as number,
        }
      })

    // ── Helper: count flags for current directive ─────────────────────────────
    const getFlagsForDirective = async (directiveKey: string): Promise<number> =>
      page.evaluate((key: string) => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['game']() as Record<string, unknown>
        const flags = state['flags'] as Array<Record<string, unknown>>
        return flags.filter(f => f['directive_key'] === key).length
      }, directiveKey)

    // ── Helper: submit one flag ───────────────────────────────────────────────
    const submitFlag = async (citizenId: string): Promise<void> =>
      page.evaluate((id: string) => {
        const w = window as unknown as Record<string, Record<string, (a: unknown, b: unknown, c: unknown) => void>>
        w.__stores['game']()['submitFlag'](id, 'monitoring', 'test justification')
      }, citizenId)

    // ── Helper: get all directives sorted by week (full objects for advanceDirective) ─────────────
    const getDirectives = async (): Promise<Array<Record<string, unknown>>> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['content']() as Record<string, unknown>
        const scenario = state['scenario'] as Record<string, unknown>
        const directives = scenario['directives'] as Array<Record<string, unknown>>
        return [...directives].sort(
          (a, b) => (a['week_number'] as number) - (b['week_number'] as number),
        )
      })

    // ── Helper: advance to next directive ─────────────────────────────────────
    const advanceToDirective = async (
      nextDirective: Record<string, unknown> | null,
    ): Promise<void> =>
      page.evaluate(
        (next: Record<string, unknown> | null) => {
          const w = window as unknown as Record<
            string,
            Record<string, (d: unknown) => void>
          >
          w.__stores['game']()['advanceDirective'](next)
        },
        nextDirective,
      )

    // ── Get all directives ────────────────────────────────────────────────────
    const directives = await getDirectives()
    expect(directives).toHaveLength(6)
    expect((directives[0] as Record<string, unknown>)['week_number']).toBe(1)
    expect((directives[5] as Record<string, unknown>)['week_number']).toBe(6)

    // ── Get a pool of citizen IDs to use across weeks ─────────────────────────
    // We need up to 5 flags in a single week (week 5 quota = 5)
    // Use indices 0, 1, 2, 3, 4 for each week's flags (reused across weeks is fine
    // because directive_key scoping means no duplicate per directive)
    // But wait: each citizen can only be flagged once per run (no dedup check in the store).
    // We'll use a different citizen for each flag submission to be safe.
    // Total flags: 2+2+3+4+5+1 = 17, we have 50 citizens.
    let citizenPoolIndex = 0
    const getNextCitizen = async (): Promise<string> => {
      const id = await getCitizenId(citizenPoolIndex)
      citizenPoolIndex++
      return id
    }

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 1: quota = 2
    // ────────────────────────────────────────────────────────────────────────
    const week1Info = await getDirectiveInfo()
    expect(week1Info.week).toBe(1)
    expect(week1Info.quota).toBe(2)

    for (let i = 0; i < week1Info.quota; i++) {
      const cid = await getNextCitizen()
      await submitFlag(cid)
    }

    const week1Flags = await getFlagsForDirective(week1Info.key)
    expect(week1Flags).toBe(2)

    // Advance to week 2
    await advanceToDirective(directives[1]!)

    // ── Verify contract event for week 2 fired ────────────────────────────────
    const firedAfterWeek1 = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['game']() as Record<string, unknown>)['firedContractKeys']
    })
    expect(firedAfterWeek1).toContain('2')

    // ── Verify week number advanced ───────────────────────────────────────────
    const week2Number = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['game']() as Record<string, unknown>)['weekNumber']
    })
    expect(week2Number).toBe(2)

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 2: quota = 2
    // ────────────────────────────────────────────────────────────────────────
    const week2Info = await getDirectiveInfo()
    expect(week2Info.week).toBe(2)

    for (let i = 0; i < week2Info.quota; i++) {
      const cid = await getNextCitizen()
      await submitFlag(cid)
    }

    await advanceToDirective(directives[2]!)

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 3: quota = 3
    // ────────────────────────────────────────────────────────────────────────
    const week3Info = await getDirectiveInfo()
    expect(week3Info.week).toBe(3)

    for (let i = 0; i < week3Info.quota; i++) {
      const cid = await getNextCitizen()
      await submitFlag(cid)
    }

    await advanceToDirective(directives[3]!)

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 4: quota = 4 — autoflag should unlock after advancing here
    // ────────────────────────────────────────────────────────────────────────
    const week4Info = await getDirectiveInfo()
    expect(week4Info.week).toBe(4)

    // Autoflag becomes available at week 4 (contract event unlocks it)
    const autoFlagAvailable = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      const autoFlagState = state['autoFlagState'] as Record<string, unknown>
      return autoFlagState['is_available']
    })
    expect(autoFlagAvailable).toBe(true)

    for (let i = 0; i < week4Info.quota; i++) {
      const cid = await getNextCitizen()
      await submitFlag(cid)
    }

    await advanceToDirective(directives[4]!)

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 5: quota = 5
    // ────────────────────────────────────────────────────────────────────────
    const week5Info = await getDirectiveInfo()
    expect(week5Info.week).toBe(5)

    for (let i = 0; i < week5Info.quota; i++) {
      const cid = await getNextCitizen()
      await submitFlag(cid)
    }

    await advanceToDirective(directives[5]!)

    // ────────────────────────────────────────────────────────────────────────
    // WEEK 6: quota = 1 — must flag Jessica Martinez (or any citizen)
    // The store locks to Jessica Martinez in week 6, but submitFlag still
    // accepts any citizenId — we submit a normal citizen since we're testing
    // the game loop, not the week-6 filter.
    // ────────────────────────────────────────────────────────────────────────
    const week6Info = await getDirectiveInfo()
    expect(week6Info.week).toBe(6)
    expect(week6Info.quota).toBe(1)

    const week6Cid = await getNextCitizen()
    await submitFlag(week6Cid)

    // ── Advance with null → triggers game over ────────────────────────────────
    await advanceToDirective(null)

    // ── Verify ending screen ──────────────────────────────────────────────────
    // _checkTerminalEnding sets uiStore.currentScreen to 'ending'
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const uiState = w.__stores['ui']() as Record<string, unknown>
        return uiState['currentScreen'] === 'ending'
      },
      { timeout: 5000 },
    )

    const finalScreen = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['ui']() as Record<string, unknown>)['currentScreen']
    })
    expect(finalScreen).toBe('ending')

    // ── Verify final state sanity ─────────────────────────────────────────────
    const completedKeys = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['game']() as Record<string, unknown>)['completedDirectiveKeys']
    })
    // All 6 directives completed
    expect((completedKeys as string[]).length).toBe(6)

    const totalFlags = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const state = w.__stores['game']() as Record<string, unknown>
      return (state['flags'] as unknown[]).length
    })
    // Total flags submitted: 2+2+3+4+5+1 = 17
    expect(totalFlags).toBe(17)
  })
})
