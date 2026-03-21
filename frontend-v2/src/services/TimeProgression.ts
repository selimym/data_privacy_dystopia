/**
 * TimeProgression — directive week → time period mapping and helpers.
 * Pure utility. No store imports.
 */
import type { TimePeriod } from '@/types/game'

/**
 * Maps directive week number to the time period shown in cinematic outcomes.
 * Completing week N shows outcomes at the time period for week N.
 */
export const DIRECTIVE_TIME_MAP: Record<number, TimePeriod> = {
  1: 'immediate',
  2: '1_month',
  3: '6_months',
  4: '6_months',
  5: '1_year',
  6: '1_year',
}

/** Canonical display labels for time periods */
export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  immediate: 'Immediate Outcome',
  '1_month': '1 Month Later',
  '6_months': '6 Months Later',
  '1_year': '1 Year Later',
}

/**
 * Returns the time period for a given directive week.
 * Falls back to 'immediate' for unknown week numbers.
 */
export function getTimePeriodForWeek(weekNumber: number): TimePeriod {
  return DIRECTIVE_TIME_MAP[weekNumber] ?? 'immediate'
}

/**
 * Returns true when completing `currentWeek` should trigger a cinematic
 * time-jump (i.e. the time period changes between weeks).
 */
export function shouldShowTimeProgression(
  currentWeek: number,
  nextWeek: number,
): boolean {
  const current = DIRECTIVE_TIME_MAP[currentWeek]
  const next = DIRECTIVE_TIME_MAP[nextWeek]
  return !!current && !!next && current !== next
}

/**
 * Ordered list of time periods for comparison.
 */
const TIME_PERIOD_ORDER: TimePeriod[] = ['immediate', '1_month', '6_months', '1_year']

/**
 * Returns true if `a` comes before `b` in the timeline.
 */
export function isEarlierPeriod(a: TimePeriod, b: TimePeriod): boolean {
  return TIME_PERIOD_ORDER.indexOf(a) < TIME_PERIOD_ORDER.indexOf(b)
}
