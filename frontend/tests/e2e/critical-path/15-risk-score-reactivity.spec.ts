import { test, expect } from '@playwright/test'

/**
 * Test 15 — Risk score reactivity on domain unlock
 *
 * Verifies that ALL citizen risk scores in the queue recompute when new data
 * domains are unlocked via contract events, WITHOUT the player clicking any
 * individual citizen.
 *
 * Previous version only waited for `some` scores to change, which passed via
 * a race condition: if the initial batch worker hadn't finished when the test
 * advanced weeks, a few citizens still had null scores in the stale skeletons
 * array, so the domain-unlock worker happened to compute those few. In real
 * play the initial pass always completes first, so the stale array had all
 * non-null scores, the worker skipped everyone, and scores stayed '···' forever.
 *
 * This version:
 *  1. Waits for ALL non-NPC scores to be non-null before snapshotting (removes
 *     the race condition — ensures initial pass is complete).
 *  2. After domain unlock, waits for ALL non-NPC scores to be non-null again
 *     (not just one change). A single stale-skeleton bug would leave most
 *     citizens at null indefinitely and this assertion would time out.
 */

test.describe('15 — Risk score reactivity', () => {
  test('all scores recompute after domain unlock without citizen click', async ({ page }) => {
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

    // ── Wait for ALL non-NPC scores to be populated (not just some) ──────────
    // This eliminates the race condition where a partial initial pass left some
    // skeletons at null, making the domain-unlock worker appear to work even
    // when it was actually passing stale (pre-clear) skeletons to computeRiskForAll.
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
        const nonNpc = skeletons.filter(s => !s['is_scenario_npc'])
        return nonNpc.length > 0 && nonNpc.every(s => s['risk_score_cache'] !== null)
      },
      { timeout: 30000 },
    )

    // ── Snapshot all scores — at this point every non-NPC has a real score ───
    const week1Scores = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
      return skeletons.map(s => ({ id: s['id'] as string, score: s['risk_score_cache'] as number | null }))
    })

    const nonNullCount = week1Scores.filter(s => s.score !== null).length
    expect(nonNullCount).toBeGreaterThan(0)

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getDirectiveInfo = (): Promise<{ quota: number; week: number }> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const state = w.__stores['game']() as Record<string, unknown>
        const d = state['currentDirective'] as Record<string, unknown>
        return { quota: d['flag_quota'] as number, week: d['week_number'] as number }
      })

    const submitFlags = async (count: number, startIdx: number): Promise<void> => {
      for (let i = startIdx; i < startIdx + count; i++) {
        await page.evaluate((idx: number) => {
          const w = window as unknown as Record<string, Record<string, () => unknown>>
          const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
          const nonNpc = (skeletons as Array<Record<string, unknown>>).filter(s => !s['is_scenario_npc'])
          ;(w.__stores['game']() as Record<string, (a: unknown, b: unknown, c: unknown) => void>)['submitFlag'](
            nonNpc[idx]!['id'] as string, 'monitoring', 'test',
          )
        }, i)
      }
    }

    const getDirectives = (): Promise<Array<Record<string, unknown>>> =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const scenario = (w.__stores['content']() as Record<string, unknown>)['scenario'] as Record<string, unknown>
        return [...(scenario['directives'] as Array<Record<string, unknown>>)].sort(
          (a, b) => (a['week_number'] as number) - (b['week_number'] as number),
        )
      })

    const advanceToDirective = (next: Record<string, unknown> | null): Promise<void> =>
      page.evaluate((d: Record<string, unknown> | null) => {
        const w = window as unknown as Record<string, Record<string, (a: unknown) => void>>
        w.__stores['game']()['advanceDirective'](d)
      }, next)

    const directives = await getDirectives()

    // ── Week 1 → 2 ───────────────────────────────────────────────────────────
    const w1 = await getDirectiveInfo()
    expect(w1.week).toBe(1)
    await submitFlags(w1.quota, 0)
    await advanceToDirective(directives[1]!)

    // ── Week 2 → 3 (contract event fires: health domain unlocked) ────────────
    const w2 = await getDirectiveInfo()
    expect(w2.week).toBe(2)
    await submitFlags(w2.quota, w1.quota)
    await advanceToDirective(directives[2]!)

    // ── Verify unlocked domains grew ─────────────────────────────────────────
    const unlockedDomains = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      return (w.__stores['content']() as Record<string, unknown>)['unlockedDomains'] as string[]
    })
    expect(unlockedDomains.length).toBeGreaterThan(2)

    // ── ALL non-NPC scores must re-populate after the domain-unlock clear ─────
    // The domain-unlock handler calls clearAllRiskScoreCaches() then
    // computeRiskForAll(). If computeRiskForAll receives stale (pre-clear)
    // skeletons, it skips every citizen (risk_score_cache !== null) and
    // onUpdate is never called. Scores stay null indefinitely.
    // This assertion would time out in that case.
    await page.waitForFunction(
      () => {
        const w = window as unknown as Record<string, Record<string, () => unknown>>
        const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
        const nonNpc = skeletons.filter(s => !s['is_scenario_npc'])
        return nonNpc.every(s => s['risk_score_cache'] !== null)
      },
      { timeout: 30000 },
    )

    // Spot-check: at least one score should differ from the week-1 value
    // (more domains = different inference results = different scores for some citizens)
    const finalScores = await page.evaluate(() => {
      const w = window as unknown as Record<string, Record<string, () => unknown>>
      const skeletons = (w.__stores['citizens']() as Record<string, unknown>)['skeletons'] as Array<Record<string, unknown>>
      return skeletons.map(s => ({ id: s['id'] as string, score: s['risk_score_cache'] as number | null }))
    })

    const anyChanged = finalScores.some(s => {
      const old = week1Scores.find(o => o.id === s.id)
      return old !== undefined && old.score !== null && s.score !== null && s.score !== old.score
    })
    expect(anyChanged).toBe(true)
  })
})
