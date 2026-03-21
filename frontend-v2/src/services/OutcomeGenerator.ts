/**
 * OutcomeGenerator — generates a CitizenOutcome from a flag + time period.
 * Pure function. Template interpolation uses safe string replacement.
 */
import type { CitizenFlag, CitizenOutcome, TimePeriod } from '@/types/game'
import type { CitizenSkeleton } from '@/types/citizen'
import type { OutcomeTemplates } from '@/types/content'

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const val = vars[key]
    return val !== undefined ? String(val) : match
  })
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function generateOutcome(
  flag: CitizenFlag,
  citizen: CitizenSkeleton,
  timePeriod: TimePeriod,
  templates: OutcomeTemplates,
): CitizenOutcome {
  const flagTemplates = templates.outcome_templates[flag.flag_type]
  const template = flagTemplates?.[timePeriod]

  if (!template) {
    return {
      citizen_id: citizen.id,
      citizen_name: `${citizen.first_name} ${citizen.last_name}`,
      flag_type: flag.flag_type,
      time_period: timePeriod,
      status: 'Unknown',
      narrative: 'Outcome data unavailable.',
      statistics: {},
      generated_at: new Date().toISOString(),
    }
  }

  const fullName = `${citizen.first_name} ${citizen.last_name}`
  const vars: Record<string, string | number> = {
    name: fullName,
    social_reduction: 55 + Math.floor(Math.random() * 27),   // 55-81
    connections_lost: 35 + Math.floor(Math.random() * 27),   // 35-61
    family_event: pick(templates.family_events),
    detention_conditions: pick(templates.detention_conditions),
    additional_impact: `${citizen.first_name} reports increased anxiety.`,
    job_impact: `${citizen.first_name} cannot cover rent without income.`,
    health_impact: `${citizen.first_name} cannot access medication without insurance.`,
    family_separation_narrative: `${citizen.first_name}'s children were placed in temporary care.`,
    final_status: `${citizen.first_name} now cooperates fully with authorities.`,
  }

  const narrative = interpolate(template.narrative, vars)

  // Merge template statistics with random variance
  const statistics: Record<string, unknown> = { ...template.statistics }

  return {
    citizen_id: citizen.id,
    citizen_name: fullName,
    flag_type: flag.flag_type,
    time_period: timePeriod,
    status: template.status,
    narrative,
    statistics,
    generated_at: new Date().toISOString(),
  }
}

/** Maps a directive week number to the time period for outcomes */
export const DIRECTIVE_TIME_MAP: Record<number, TimePeriod> = {
  1: 'immediate',
  2: '1_month',
  3: '6_months',
  4: '6_months',
  5: '1_year',
  6: '1_year',
}
