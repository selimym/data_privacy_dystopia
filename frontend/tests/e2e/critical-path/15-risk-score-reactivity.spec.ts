import { test, expect } from '@playwright/test'

/**
 * Test 15 — Risk score reactivity on domain unlock
 *
 * Verifies that citizen risk scores in the queue update automatically when
 * new data domains are unlocked via contract events (weeks 3–4), WITHOUT
 * the player clicking on any individual citizen.
 *
 * This is a regression test for the bug where computeRiskForAll() was only
 * called once at startup and did not re-run when domains expanded.
 */

test.describe('15 — Risk score reactivity', () => {
  test('risk scores update in queue when domains unlock (no citizen click required)', async ({ page }) => {
    await page.goto('/')

    // ── Wait for game globals ────────────────────────────────────────────────
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

    // ── Wait for initial background risk computation to finish ───────────────
    // Give the batch worker time to populate initial scores
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
        return skeletons.some(s => s['risk_score_cache'] !== null)
      },
      { timeout: 15000 },
    )

    // ── Snapshot risk scores after week 1 ───────────────────────────────────
    const week1Scores = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
      return skeletons.map(s => ({ id: s['id'] as string, score: s['risk_score_cache'] as number | null }))
    })

    // ── Helper: get directive info ───────────────────────────────────────────
    const getDirectiveInfo = (): Promise<{ key: string; quota: number; week: number; type: string }> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['game']() as Record<string, unknown>
        const d = state['currentDirective'] as Record<string, unknown>
        return {
          key: d['directive_key'] as string,
          quota: d['flag_quota'] as number,
          week: d['week_number'] as number,
          type: (d['directive_type'] as string | undefined) ?? 'review',
        }
      })

    // ── Helper: submit flags ─────────────────────────────────────────────────
    const submitFlags = async (count: number, startIdx: number): Promise<void> => {
      for (let i = startIdx; i < startIdx + count; i++) {
        await page.evaluate((idx: number) => {
          const w = window as unknown as Record<string, Record<string, () => unknown>>
          const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
          const citizenId = skeletons[idx]!['id'] as string
          ;(w.__stores['game']() as Record<string, (a: unknown, b: unknown, c: unknown) => void>)['submitFlag'](citizenId, 'monitoring', 'test')
        }, i)
      }
    }

    // ── Helper: get all directives ───────────────────────────────────────────
    const getDirectives = (): Promise<Array<Record<string, unknown>>> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const scenario = (w.__stores['content']() as Record<string, unknown>)['scenario'] as Record<string, unknown>
        return [...(scenario['directives'] as Array<Record<string, unknown>>)].sort(
          (a, b) => (a['week_number'] as number) - (b['week_number'] as number),
        )
      })

    // ── Helper: advance directive ────────────────────────────────────────────
    const advanceToDirective = (next: Record<string, unknown> | null): Promise<void> =>
      page.evaluate((d: Record<string, unknown> | null) => {
        const w = window as unknown as Record<string, Record<string, (a: unknown) => void>>
        w.__stores['game']()['advanceDirective'](d)
      }, next)

    const directives = await getDirectives()

    // ── Week 1: submit quota, advance ────────────────────────────────────────
    const w1 = await getDirectiveInfo()
    expect(w1.week).toBe(1)
    await submitFlags(w1.quota, 0)
    await advanceToDirective(directives[1]!)

    // ── Week 2: submit quota, advance ────────────────────────────────────────
    const w2 = await getDirectiveInfo()
    expect(w2.week).toBe(2)
    await submitFlags(w2.quota, w1.quota)
    await advanceToDirective(directives[2]!)

    // ── Week 3: a contract event fires that unlocks new domains ──────────────
    // At this point the domain-unlock subscription should have triggered
    // a recomputation. Wait up to 10 seconds for at least one citizen's
    // score to change from the week-1 snapshot — without clicking any citizen.
    const changed = await page.waitForFunction(
      (snapshot: Array<{ id: string; score: number | null }>) => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
        return skeletons.some(s => {
          const old = snapshot.find(o => o.id === (s['id'] as string))
          const newScore = s['risk_score_cache'] as number | null
          if (old === undefined || old.score === null || newScore === null) return false
          return newScore !== old.score
        })
      },
      week1Scores,
      { timeout: 10000 },
    )

    expect(changed).toBeTruthy()

    // ── Verify unlocked domains actually grew ────────────────────────────────
    const unlockedDomains = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['content']() as Record<string, unknown>)['unlockedDomains'] as string[]
    })

    // Week 3 contract event should have added at least one domain beyond the initial set
    expect(unlockedDomains.length).toBeGreaterThan(2)
  })
})
