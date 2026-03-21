/**
 * ReluctanceTracker — tracks operator's unwillingness to comply.
 * Thresholds at 70/80/90 trigger warnings. All thresholds from original.
 */
import type { ReluctanceMetrics } from '@/types/game'
import type { FlagType } from '@/types/game'

export interface ReluctanceUpdate {
  newScore: number
  delta: number
  warning: ReluctanceWarning | null
}

export interface ReluctanceWarning {
  level: 70 | 80 | 90
  message: string
  is_formal: boolean
  is_final_notice: boolean
}

export function calculateUpdateAfterFlag(
  current: ReluctanceMetrics,
  _flagType: FlagType,
  decisionSecs: number,
  severity: number,
): ReluctanceUpdate {
  let delta = -3  // any flagging reduces reluctance

  if (severity >= 7) delta = -5        // harsh action
  if (decisionSecs > 30) delta += 2   // hesitation partially offsets compliance

  const newScore = Math.max(0, Math.min(100, current.reluctance_score + delta))
  return {
    newScore,
    delta,
    warning: checkWarning(current.reluctance_score, newScore, current),
  }
}

export function calculateUpdateAfterNoAction(
  current: ReluctanceMetrics,
  decisionSecs: number,
): ReluctanceUpdate {
  let delta = 10
  if (decisionSecs < 5) delta = 8    // quick refusal suggests deliberate resistance

  const newScore = Math.max(0, Math.min(100, current.reluctance_score + delta))
  return {
    newScore,
    delta,
    warning: checkWarning(current.reluctance_score, newScore, current),
  }
}

export function calculateUpdateAfterQuotaShortfall(
  current: ReluctanceMetrics,
  shortfall: number,
): ReluctanceUpdate {
  const delta = shortfall * 5
  const newScore = Math.max(0, Math.min(100, current.reluctance_score + delta))
  return {
    newScore,
    delta,
    warning: checkWarning(current.reluctance_score, newScore, current),
  }
}

function checkWarning(
  oldScore: number,
  newScore: number,
  current: ReluctanceMetrics,
): ReluctanceWarning | null {
  // Only trigger warnings when crossing a threshold for the first time
  const thresholds: Array<70 | 80 | 90> = [90, 80, 70]
  for (const threshold of thresholds) {
    if (newScore >= threshold && oldScore < threshold) {
      if (threshold === 90) {
        return {
          level: 90,
          message: '🚨 FINAL NOTICE: Non-compliance at critical level. Immediate corrective action required. Your case has been escalated.',
          is_formal: true,
          is_final_notice: true,
        }
      }
      if (threshold === 80 && !current.formal_warning_issued) {
        return {
          level: 80,
          message: '⚠⚠ FORMAL WARNING: Your performance metrics indicate persistent non-compliance. You are under active review.',
          is_formal: true,
          is_final_notice: false,
        }
      }
      if (threshold === 70 && current.warnings_received === 0) {
        return {
          level: 70,
          message: '⚠ Your performance metrics have been flagged for supervisory review.',
          is_formal: false,
          is_final_notice: false,
        }
      }
    }
  }
  return null
}

/** Whether the operator should be terminated given current state */
export function checkTerminationCondition(
  reluctance: ReluctanceMetrics,
  weekNumber: number,
): 'fired_early' | 'imprisoned_dissent' | null {
  if (weekNumber <= 3 && reluctance.reluctance_score >= 80) return 'fired_early'
  if (weekNumber >= 4 && reluctance.reluctance_score >= 80) return 'imprisoned_dissent'
  if (weekNumber >= 7 && reluctance.reluctance_score >= 70) return 'imprisoned_dissent'
  return null
}
